import { ImageResponse } from '@ethercorps/sveltekit-og';
import type { RequestHandler } from './$types';

// Simplified favicon SVG (no gradients for Satori compatibility)
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="96" height="96">
  <rect x="4" y="4" width="56" height="56" rx="16" fill="#0b1224"/>
  <rect x="4.5" y="4.5" width="55" height="55" rx="15.5" fill="none" stroke="#c084fc" stroke-opacity="0.14"/>
  <path d="M19 18v20c0 8.5 6.5 15 13 15s13-6.5 13-15V18" fill="none" stroke="#c084fc" stroke-linecap="round" stroke-linejoin="round" stroke-width="6"/>
  <path d="m26 34 6 6 6-9" fill="none" stroke="#d8b4fe" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/>
</svg>`;

const logoDataUrl = `data:image/svg+xml,${encodeURIComponent(logoSvg)}`;

export const GET: RequestHandler = async () => {
	const html = `
		<div tw="flex flex-col w-full h-full bg-[#0f172a] p-16">
			<div tw="flex flex-col flex-1 justify-center items-center">
				<div tw="flex items-center mb-8">
					<img src="${logoDataUrl}" width="96" height="96" tw="mr-6" />
					<span tw="text-7xl font-bold text-white">uhabit</span>
				</div>
				<span tw="text-4xl text-[#c084fc] font-semibold mb-4">Build Better Habits</span>
				<span tw="text-2xl text-gray-400 text-center">
					Track your daily habits, build consistency, and achieve your goals.
				</span>
			</div>
			<div tw="flex justify-center">
				<div tw="flex items-center bg-[#1e293b] rounded-full px-6 py-3">
					<div tw="flex w-3 h-3 rounded-full bg-green-500 mr-3"></div>
					<span tw="text-gray-300 text-xl">Start tracking today</span>
				</div>
			</div>
		</div>
	`;

	return new ImageResponse(html, {
		width: 1200,
		height: 630
	});
};
