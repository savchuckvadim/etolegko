import { defineConfig } from 'orval';

export default defineConfig({
    api: {
        input: {
            target: 'http://localhost:3000/docs-json',
        },
        output: {
            target: './src/shared/api/generated',
            client: 'react-query',
            mode: 'tags-split',
            schemas: './src/shared/api/generated/models',
            mock: false,
            override: {
                mutator: {
                    path: './src/shared/api/axios-instance.ts',
                    name: 'customInstance',
                },
                query: {
                    useQuery: true,
                    useInfinite: false,
                    useInfiniteQueryParam: 'page',
                },
            },
        },
    },
});
