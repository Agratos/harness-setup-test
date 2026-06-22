import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '@/app';

describe('App (스모크 테스트)', () => {
	it('핵심 heading "bookmark-manager" 을 렌더한다', () => {
		render(<App />);
		expect(screen.getByRole('heading', { name: 'bookmark-manager' })).toBeInTheDocument();
	});
});
