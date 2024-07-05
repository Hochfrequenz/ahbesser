import pulumi
import pulumi_docker as docker

import pulumi_github as github
import pulumi_azure_native as azure_native

# Import the program's configuration settings.
config = pulumi.Config()
# app_path = config.get("appPath", "./app")
image_name = config.get("imageName", "my-app")
image_tag = config.get("imageTag", "latest")
container_port = config.get_int("containerPort", 80)
cpu = config.get_int("cpu", 1)
memory = config.get_int("memory", 2)
# Create an Azure Resource Group
resource_group = azure_native.resources.ResourceGroup("resource_group")

# Create an Azure Storage Account
storage_account = azure_native.storage.StorageAccount(
    "storageaccount",
    resource_group_name=resource_group.name,
    sku=azure_native.storage.SkuArgs(
        name=azure_native.storage.SkuName.STANDARD_LRS,
    ),
    kind=azure_native.storage.Kind.STORAGE_V2,
)

# Create an Azure Blob Container
blob_container = azure_native.storage.BlobContainer(
    "blobcontainer",
    resource_group_name=resource_group.name,
    account_name=storage_account.name,
    public_access=azure_native.storage.PublicAccess.NONE,
)

# Create the Docker Image from GHCR
image = docker.Image(
    "ghcr-image",
    image_name="ghcr.io/Hochfrequenz/image:tag",
    registry=docker.RegistryArgs(
        server="ghcr.io",
        username="lord-haffi",
        password=pulumi.Config("dockerconfig").require_secret("ghcr_token"),
    ),
)

# Define container ports and environment variables if needed
ports = [docker.ContainerPortArgs(internal=80, external=80)]

# Create the Docker Container
container = docker.Container(
    "app-container",
    image=image.image_name,
    ports=ports,
    envs=[
        # Add your environment variables here
        f"AZURE_STORAGE_ACCOUNT={storage_account.name}",
        f"AZURE_CONTAINER_NAME={blob_container.name}",
    ],
)

container_group = azure_native.containerinstance.ContainerGroup(
    "containergroup",
    resource_group_name=resource_group.name,
    os_type="Linux",
    containers=[
        azure_native.containerinstance.ContainerArgs(
            name="app-container",
            image=image.image_name,
            resources=azure_native.containerinstance.ResourceRequirementsArgs(
                requests=azure_native.containerinstance.ResourceRequestsArgs(
                    cpu=0.5, memory_in_gb=1.5
                )
            ),
            ports=[azure_native.containerinstance.ContainerPortArgs(port=80)],
        )
    ],
    ip_address=azure_native.containerinstance.IpAddressArgs(
        ports=[azure_native.containerinstance.PortArgs(port=80)], type="Public"
    ),
)

# Setup custom domain and HTTPS with Azure App Service and a Custom Domain Binding
app_service_plan = azure_native.web.AppServicePlan(
    "appserviceplan",
    resource_group_name=resource_group.name,
    sku=azure_native.web.SkuDescriptionArgs(
        name="B1",
        tier="Basic",
    ),
)

web_app = azure_native.web.WebApp(
    "webapp",
    resource_group_name=resource_group.name,
    server_farm_id=app_service_plan.id,
    site_config=azure_native.web.SiteConfigArgs(
        app_settings=[
            azure_native.web.NameValuePairArgs(
                name="WEBSITES_ENABLE_APP_SERVICE_STORAGE", value="false"
            ),
        ],
        always_on=True,
        https_only=True,
    ),
    https_only=True,
)

# # Use a random string to give the service a unique DNS name.
# dns_name = random.RandomString(
#     "dns-name",
#     random.RandomStringArgs(
#         length=8,
#         special=False,
#     ),
# ).result.apply(lambda result: f"{image_name}-{result.lower()}")

custom_domain_binding = azure_native.web.CustomHostnameBinding(
    "customdomainbinding",
    hostname="ahb-tabellen.dev.hochfrequenz.de",
    resource_group_name=resource_group.name,
    app_service_name=web_app.name,
    ssl_state=azure_native.web.SslState.SNI_ENABLED,
    thumbprint="<your-ssl-certificate-thumbprint>",
)

# Add Azure Blob Storage operation to GitHub Actions
github_actions_secret = github.ActionsSecret(
    "azure_storage_connection_string",
    repository="your-repo",
    secret_name="AZURE_STORAGE_CONNECTION_STRING",
    plaintext_value=pulumi.Output.all(resource_group.name, storage_account.name).apply(
        lambda args: f"DefaultEndpointsProtocol=https;AccountName={args[1]};AccountKey=<account-key>;EndpointSuffix=core.windows.net"
    ),
)

pulumi.export("storage_account", storage_account.name)
pulumi.export("blob_container", blob_container.name)
pulumi.export("docker_image", image.image_name)
pulumi.export(
    "app_url",
    web_app.default_site_hostname.apply(lambda hostname: f"https://{hostname}"),
)


#  **********************************************************************************************************************


# Create a container group for the service that makes it publicly accessible.
container_group = containerinstance.ContainerGroup(
    "container-group",
    containerinstance.ContainerGroupArgs(
        resource_group_name=resource_group.name,
        os_type="linux",
        restart_policy="always",
        image_registry_credentials=[
            containerinstance.ImageRegistryCredentialArgs(
                server=registry.login_server,
                username=registry_username,
                password=registry_password,
            ),
        ],
        containers=[
            containerinstance.ContainerArgs(
                name=image_name,
                image=image.image_name,
                ports=[
                    containerinstance.ContainerPortArgs(
                        port=container_port,
                        protocol="tcp",
                    ),
                ],
                environment_variables=[
                    containerinstance.EnvironmentVariableArgs(
                        name="FLASK_RUN_PORT",
                        value=str(container_port),
                    ),
                    containerinstance.EnvironmentVariableArgs(
                        name="FLASK_RUN_HOST",
                        value="0.0.0.0",
                    ),
                ],
                resources=containerinstance.ResourceRequirementsArgs(
                    requests=containerinstance.ResourceRequestsArgs(
                        cpu=cpu,
                        memory_in_gb=memory,
                    ),
                ),
            ),
        ],
        ip_address=containerinstance.IpAddressArgs(
            type=containerinstance.ContainerGroupIpAddressType.PUBLIC,
            dns_name_label=dns_name,
            ports=[
                containerinstance.PortArgs(
                    port=container_port,
                    protocol="tcp",
                ),
            ],
        ),
    ),
)

# Export the service's IP address, hostname, and fully-qualified URL.
pulumi.export("hostname", container_group.ip_address.apply(lambda addr: addr.fqdn))
pulumi.export("ip", container_group.ip_address.apply(lambda addr: addr.ip))
pulumi.export(
    "url",
    container_group.ip_address.apply(
        lambda addr: f"http://{addr.fqdn}:{container_port}"
    ),
)
