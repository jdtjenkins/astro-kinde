import {
    defineIntegration,
    addVirtualImports,
    createResolver,
} from "astro-integration-kit";
import { z } from "astro/zod";
import type { Config } from "./types.ts";

const defaultConfig = {
    clientId: "",
    clientSecret: "",
    domain: "",
    callbackUri: "",
    signedInUri: "",
    signedOutUri: "",
    responseType: "code",
    scope: "openid email profile offline",
} satisfies Partial<Config>;

// Injects predefined routes into the application
function injectRoutes(params: any, resolve: (path: string) => string) {
    const routes = [
        { pattern: "/api/kinde/login", entrypoint: "./api/login.js" },
        { pattern: "/api/kinde/register", entrypoint: "./api/register.js" },
        { pattern: "/api/kinde/callback", entrypoint: "./api/callback.js" },
        { pattern: "/api/kinde/signout", entrypoint: "./api/signout.js" },
        {
            pattern: "/api/kinde/isAuthenticated",
            entrypoint: "./api/isAuthenticated.js",
        },
        { pattern: "/api/kinde/getUser", entrypoint: "./api/getUser.js" },
    ];

    routes.forEach(({ pattern, entrypoint }) => {
        params.injectRoute({
            pattern,
            entrypoint: resolve(entrypoint),
        });
    });
}

const kinde = defineIntegration({
    name: "kinde-integration",
    optionsSchema: z.custom<Partial<Config>>().default({}),
    setup({ options, name }) {
        const { resolve } = createResolver(import.meta.url);
        return {
            hooks: {
                "astro:config:setup": ({ addMiddleware, ...params }) => {
                    addVirtualImports(
                        { addMiddleware, ...params },
                        {
                            name,
                            imports: {
                                "virtual:kinde-integration/config": `export default ${JSON.stringify(
                                    { ...defaultConfig, ...options }
                                )}`,
                            },
                        }
                    );
                    injectRoutes(params, resolve);
                    addMiddleware({
                        entrypoint: resolve("./authMiddleware.js"),
                        order: "pre",
                    });
                },
            },
        };
    },
});

export default kinde;
export { getUserData } from "./getUserData.ts";
