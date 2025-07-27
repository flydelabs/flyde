import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PlaygroundIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the default example
    router.replace('/playground/blog-generator');
  }, [router]);

  return null;
}