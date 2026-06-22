import { HomePage } from '@/pages/home';

import { Providers } from './providers';

export const App = () => {
	return (
		<Providers>
			<main>
				<h1>bookmark-manager</h1>
				<p>내 북마크를 한 곳에서 관리</p>
				<HomePage />
			</main>
		</Providers>
	);
};
