import * as pulumi from "@pulumi/pulumi";
import * as auth0 from "@pulumi/auth0";

// -----------------------------------------------------------------------------
// Auth0 configuration for AHB-tables, managed as code.
//
// The Auth0 tenant `auth.hochfrequenz.de` is SHARED across prod/stage/dev, which
// is why this project has a single stack (`shared`) rather than the per-env
// stage/prod stacks used by the Azure `infra/` project.
//
// IMPORTANT — adoption strategy is IMPORT, not recreate:
//   These resources already exist and serve live logins. Bring them into state
//   with `pulumi import` (see README.md), then reconcile the definitions below
//   until `pulumi preview` shows NO changes. Never let Pulumi replace/delete a
//   live client or API. See issue #903.
//
// The Auth0 provider reads its credentials from config (auth0:domain,
// auth0:clientId, auth0:clientSecret) or the AUTH0_DOMAIN / AUTH0_CLIENT_ID /
// AUTH0_CLIENT_SECRET environment variables (used by CI). No explicit provider
// is constructed here.
// -----------------------------------------------------------------------------

const config = new pulumi.Config();

// Canonical URLs used as Auth0 API identifiers (audiences) for the MCP server.
// Kept in config so they are reviewed alongside the app's environment configs.
const mcpAudienceProd =
    config.get("mcpAudienceProd") ?? "https://ahb-tabellen.hochfrequenz.de/mcp";
const mcpAudienceStage =
    config.get("mcpAudienceStage") ?? "https://ahb-tabellen.stage.hochfrequenz.de/mcp";

// -----------------------------------------------------------------------------
// Applications (SPA clients)
//
// TODO(import): After `pulumi import`, fill in the remaining fields (callbacks,
// allowedLogoutUrls, webOrigins, allowedOrigins, grantTypes, refresh-token
// settings, …) from the imported state so `pulumi preview` is clean. The client
// IDs are the current live values, kept here for traceability:
//   - prod SPA client:      VSkXGqlTD7Rf5Q4n9a0h00rInEyL2ZQj
//   - stage/dev SPA client: Hku0EniRjy4B2krnx1sCwTIOzAiVta1B
// -----------------------------------------------------------------------------

const prodSpaClient = new auth0.Client("ahb-tabellen-prod-spa", {
    // NOTE: `name` must match the live application name exactly for a clean import.
    name: "AHB-Tabellen (prod)",
    appType: "spa",
    oidcConformant: true,
    // useRefreshTokens: true in the frontend (@auth0/auth0-angular).
    grantTypes: ["authorization_code", "implicit", "refresh_token"],
    // TODO(import): reconcile callbacks / webOrigins / allowedLogoutUrls with live config.
}, {
    // Prod login must never be recreated by an accidental change.
    protect: true,
});

const stageDevSpaClient = new auth0.Client("ahb-tabellen-stage-dev-spa", {
    name: "AHB-Tabellen (stage/dev)",
    appType: "spa",
    oidcConformant: true,
    grantTypes: ["authorization_code", "implicit", "refresh_token"],
    // TODO(import): reconcile callbacks / webOrigins / allowedLogoutUrls with live config.
});

// -----------------------------------------------------------------------------
// APIs (resource servers) for the MCP server.
// One per audience; both live on the shared tenant.
// -----------------------------------------------------------------------------

const mcpApiProd = new auth0.ResourceServer("ahb-tabellen-mcp-prod", {
    name: "AHB-Tabellen MCP (prod)",
    identifier: mcpAudienceProd,
    signingAlg: "RS256",
    // TODO(import): reconcile scopes / token lifetimes / flags with live config.
}, {
    protect: true,
});

const mcpApiStage = new auth0.ResourceServer("ahb-tabellen-mcp-stage", {
    name: "AHB-Tabellen MCP (stage)",
    identifier: mcpAudienceStage,
    signingAlg: "RS256",
    // TODO(import): reconcile scopes / token lifetimes / flags with live config.
});

export const prodSpaClientId = prodSpaClient.clientId;
export const stageDevSpaClientId = stageDevSpaClient.clientId;
export const mcpApiProdIdentifier = mcpApiProd.identifier;
export const mcpApiStageIdentifier = mcpApiStage.identifier;
