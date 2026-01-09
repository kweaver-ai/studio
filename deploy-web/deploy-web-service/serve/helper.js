import logger from "../common/logger";
import {
    configData,
    fetchParse,
    URL_PREFIX_MODE,
    URLPrefixFormatter,
} from "../handlers/tools";

export const registryClient = async () => {
    const { hydra } = configData.Module2Config;
    const { host, port, path, scheme = "https" } = configData.accessAddr;
    const prefix = URLPrefixFormatter(path, URL_PREFIX_MODE.tail);
    const payload = {
        client_name: "deploy-web",
        redirect_uris: [
            `${scheme}://${host}:${port}${prefix}/interface/deployweb/oauth/login/callback`,
        ],
        grant_types: ["authorization_code", "implicit", "refresh_token"],
        response_types: ["token id_token", "code", "token"],
        scope: "offline openid all",
        post_logout_redirect_uris: [
            `${scheme}://${host}:${port}${prefix}/interface/deployweb/oauth/logout/callback`,
        ],
        metadata: {
            device: {
                client_type: "deploy_web",
            },
            login_form: {
                third_party_login_visible: false,
                remember_password_visible: false,
                reset_password_visible: false,
                sms_login_visible: false,
            },
        },
    };
    try {
        logger.info("Fetch registered deploy-web client");
        const { text: clients } = await fetchParse(
            `${hydra.protocol}://${hydra.administrativeHost}:${hydra.administrativePort}/admin/clients?client_name=deploy-web`,
            {
                timeout: 0,
                method: "GET",
            }
        );
        logger.info("Successfully fetched registered deploy-web client");
        await Promise.all(
            clients.map(async (client) => {
                await fetchParse(
                    `${hydra.protocol}://${hydra.administrativeHost}:${hydra.administrativePort}/admin/clients/${client.client_id}`,
                    {
                        timeout: 0,
                        method: "DELETE",
                    }
                );
                logger.info(`Delete client, client_id: ${client.client_id}`);
                return;
            })
        );
        logger.info("Start calling register client interface");
        const {
            text: { client_id, client_secret },
        } = await fetchParse(
            `${hydra.protocol}://${hydra.administrativeHost}:${hydra.administrativePort}/admin/clients`,
            {
                timeout: 1000 * 6,
                method: "POST",
                body: JSON.stringify(payload),
            }
        );
        configData.updateModule2Config(client_id, client_secret);
        logger.info(
            `Register client interface called successfully, client_id: ${client_id}, client_secret: ${client_secret}`
        );
    } catch (e) {
        logger.info("Failed to call register client interface");
        logger.info(e);
        throw e;
    }
};
