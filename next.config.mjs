/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
	distDir: isDev ? ".next-dev" : ".next-build",
	outputFileTracing: false,

	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "avatars.mds.yandex.net" },
			{ protocol: "https", hostname: "images.pexels.com" },
			{ protocol: "https", hostname: "images.unsplash.com" },
			{ protocol: "https", hostname: "www.bracu.ac.bd" },
			{ protocol: "https", hostname: "bracu.ac.bd" },
			{ protocol: "https", hostname: "res.cloudinary.com" },
			{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
		],
	},

	experimental: {
		cpus: 1,
		workerThreads: false,
		webpackBuildWorker: false,
	},

	// ✅ ADD THIS (IMPORTANT FIX)
	eslint: {
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;
