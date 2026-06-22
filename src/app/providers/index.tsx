import type { PropsWithChildren } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/shared/lib/react-query/query-client';

import '@mantine/core/styles.css';

/**
 * 앱 전역 프로바이더 합성 지점.
 * MantineProvider + QueryClientProvider 를 조합한다 (docs/fsd/app.md 참고).
 */
export const Providers = ({ children }: PropsWithChildren) => {
	return (
		<MantineProvider>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</MantineProvider>
	);
};
