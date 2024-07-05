"""
Pulumi program that deploys a containerized web service to Azure Container Instances.
"""

import pulumi_docker as docker

# import pulumi_github as github
import pulumi_azure_native as azure_native
import pulumi


# Import the program's configuration settings.
config = pulumi.Config()
# app_path = config.get("appPath", "./app")
image_name = config.get("imageName")
image_tag = config.get("imageTag")
assert image_name, "imageName must be set"
assert image_tag, "imageTag must be set"

image_name_with_tag = f"{image_name}:{image_tag}"
ghcr_token = config.require_secret("ghcr_token")
assert ghcr_token, "ghcr_token must be set"

ahb_blob_container_name = config.get("ahbBlobContainerName")
assert ahb_blob_container_name, "ahbBlobContainerName must be set"

container_port = config.get_int("containerPort")
assert container_port, "containerPort must be set"

cpu = config.get_int("cpu", 1)
memory = config.get_int("memory", 2)

# Create an Azure Resource Group
resource_group = azure_native.resources.ResourceGroup("ahb-tabellen")

# Create an Azure Storage Account
storage_account = azure_native.storage.StorageAccount(
    "ahbtabellen",  # Storage account name must be between 3 and 24 characters in length and use numbers and lower-case letters only."
    resource_group_name=resource_group.name,
    sku=azure_native.storage.SkuArgs(
        name=azure_native.storage.SkuName.STANDARD_LRS,
    ),
    kind=azure_native.storage.Kind.STORAGE_V2,
)

# Create an Azure Blob Container
blob_container = azure_native.storage.BlobContainer(
    ahb_blob_container_name,
    resource_group_name=resource_group.name,
    account_name=storage_account.name,
    public_access=azure_native.storage.PublicAccess.NONE,
)

# Securely retrieve the primary storage account key
primary_key = pulumi.Output.all(resource_group.name, storage_account.name).apply(
    lambda args: azure_native.storage.list_storage_account_keys(
        resource_group_name=args[0], account_name=args[1]
    )
    .keys[0]
    .value
)

# Generate the connection string securely
azure_blob_storage_connection_string = pulumi.Output.all(
    storage_account.name, primary_key
).apply(
    lambda args: f"DefaultEndpointsProtocol=https;AccountName={args[0]};AccountKey={args[1]};EndpointSuffix=core.windows.net"
)

# # This creates the Docker image and pushes it to the GitHub Container Registry (GHCR).
# # Create the Docker Image from GHCR
# image = docker.Image(
#     resource_name="ghcr-image",
#     build=docker.DockerBuildArgs(
#         context="../.",
#         dockerfile="../Dockerfile",
#         platform="linux/amd64",
#     ),
#     image_name=image_name + ":" + image_tag,
#     registry=docker.RegistryArgs(
#         server="ghcr.io",
#         username="hf-krechan",
#         password=ghcr_token,
#     ),
# )

# Define container ports and environment variables if needed
# ports = [docker.ContainerPortArgs(internal=80, external=80)]

# Create the Docker Container
# container = docker.Container(
#     "app-container",
#     image=image_name_with_tag,
#     ports=ports,
#     envs=[
#         # Add your environment variables here
#         f"AZURE_STORAGE_ACCOUNT={storage_account.name}",
#         f"AZURE_CONTAINER_NAME={blob_container.name}",
#         f"PORT=4000",
#         f"AZURE_BLOB_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://host.docker.internal:10000/devstoreaccount1;",
#         f"AHB_CONTAINER_NAME=uploaded-files",
#         f"FORMAT_VERSION_CONTAINER_NAME=format-versions",
#     ],
# )


# Define common settings

# Resource requirements for the container
resource_requirements = azure_native.containerinstance.ResourceRequirementsArgs(
    requests=azure_native.containerinstance.ResourceRequestsArgs(
        cpu=0.5,
        memory_in_gb=1.5,
    )
)

# Port configuration for the container
container_ports = [
    azure_native.containerinstance.ContainerPortArgs(port=container_port)
]

# app_port = 80
ip_address_ports = [azure_native.containerinstance.PortArgs(port=container_port)]

# Define environment variables for the container
environment_variables = [
    azure_native.containerinstance.EnvironmentVariableArgs(
        name="PORT", value=str(container_port)
    ),
    azure_native.containerinstance.EnvironmentVariableArgs(
        name="AZURE_BLOB_STORAGE_CONNECTION_STRING",
        value=azure_blob_storage_connection_string,
    ),
    azure_native.containerinstance.EnvironmentVariableArgs(
        name="AHB_CONTAINER_NAME", value=ahb_blob_container_name
    ),
    azure_native.containerinstance.EnvironmentVariableArgs(
        name="FORMAT_VERSION_CONTAINER_NAME", value="format-versions"
    ),
    # Add more environment variables as needed
]

# Container group definition
container_group = azure_native.containerinstance.ContainerGroup(
    "ahb-tabellen",
    resource_group_name=resource_group.name,
    os_type="Linux",
    containers=[
        azure_native.containerinstance.ContainerArgs(
            name="ahb-tabellen-container",
            image=image_name_with_tag,
            resources=resource_requirements,
            ports=container_ports,
            environment_variables=environment_variables,
        )
    ],
    ip_address=azure_native.containerinstance.IpAddressArgs(
        ports=ip_address_ports, type="Public"
    ),
    image_registry_credentials=[
        azure_native.containerinstance.ImageRegistryCredentialArgs(
            server="ghcr.io",
            username="hf-krechan",
            password=ghcr_token,
        ),
    ],
)


# # Setup custom domain and HTTPS with Azure App Service and a Custom Domain Binding
# app_service_plan = azure_native.web.AppServicePlan(
#     "appserviceplan",
#     resource_group_name=resource_group.name,
#     sku=azure_native.web.SkuDescriptionArgs(
#         name="B1",
#         tier="Basic",
#     ),
# )

# web_app = azure_native.web.WebApp(
#     "webapp",
#     resource_group_name=resource_group.name,
#     server_farm_id=app_service_plan.id,
#     site_config=azure_native.web.SiteConfigArgs(
#         app_settings=[
#             azure_native.web.NameValuePairArgs(
#                 name="WEBSITES_ENABLE_APP_SERVICE_STORAGE", value="false"
#             ),
#         ],
#         always_on=True,
#     ),
#     https_only=True,
# )

# # Use a random string to give the service a unique DNS name.
# dns_name = random.RandomString(
#     "dns-name",
#     random.RandomStringArgs(
#         length=8,
#         special=False,
#     ),
# ).result.apply(lambda result: f"{image_name}-{result.lower()}")

# custom_domain_binding = azure_native.web.CustomHostnameBinding(
#     "customdomainbinding",
#     hostname="ahb-tabellen.dev.hochfrequenz.de",
#     resource_group_name=resource_group.name,
#     app_service_name=web_app.name,
#     ssl_state=azure_native.web.SslState.SNI_ENABLED,
#     thumbprint="<your-ssl-certificate-thumbprint>",
# )

# Add Azure Blob Storage operation to GitHub Actions
# github_actions_secret = github.ActionsSecret(
#     "azure_storage_connection_string",
#     repository="your-repo",
#     secret_name="AZURE_STORAGE_CONNECTION_STRING",
#     plaintext_value=pulumi.Output.all(resource_group.name, storage_account.name).apply(
#         lambda args: f"DefaultEndpointsProtocol=https;AccountName={args[1]};AccountKey=<account-key>;EndpointSuffix=core.windows.net"
#     ),
# )

# pulumi.export("storage_account", storage_account.name)
# pulumi.export("blob_container", blob_container.name)
# pulumi.export("docker_image", image.image_name)
# pulumi.export(
#     "app_url",
#     web_app.default_site_hostname.apply(lambda hostname: f"https://{hostname}"),
# )
