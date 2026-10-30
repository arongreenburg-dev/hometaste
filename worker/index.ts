import { qlooApi } from "../lib/qloo";
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const publicLimits=new Map<string,{start:number;count:number}>();
const worker = {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    if (new URL(request.url).pathname.startsWith("/api/")) {
      const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'Please use HomeTaste directly.'},{status:403});
      const ip=request.headers.get('CF-Connecting-IP')||'unknown';const now=Date.now();const previous=publicLimits.get(ip);const current=previous&&now-previous.start<60000?previous:{start:now,count:0};current.count++;if(publicLimits.size>500)publicLimits.clear();publicLimits.set(ip,current);
      if(current.count>40)return Response.json({error:'Please wait a minute before trying again.'},{status:429,headers:{'Retry-After':'60'}});
      return qlooApi(request, (env as any).QLOO_API_KEY);
    }
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};

export default worker;
