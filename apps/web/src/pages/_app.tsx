import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import '@styles/globals.css';
import { Layout } from '@components/Layout';
import { useAuthStore } from '@stores/auth.store';

const publicPages = ['/login', '/register', '/'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const isPublicPage = publicPages.includes(router.pathname);

    if (!isAuthenticated && !isPublicPage && router.pathname !== '/login') {
      router.push('/login');
    }
  }, [router.pathname, isAuthenticated]);

  const isPublicPage = publicPages.includes(router.pathname) || router.pathname === '/login';

  if (isPublicPage) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
