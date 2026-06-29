/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  serverExternalPackages: ["pg", "@aws-sdk/dsql-signer"],
}

export default nextConfig
