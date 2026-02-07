import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUsers, useUser, useCreateUser, useUpdateUser, useRemoveUser } from '../hooks/use-users';
import * as usersApi from '@entities/users';

// Мокаем API хуки
vi.mock('@entities/users', () => ({
    useUsersFindAll: vi.fn(),
    useUsersFindOne: vi.fn(),
    useUsersCreate: vi.fn(),
    useUsersUpdate: vi.fn(),
    useUsersRemove: vi.fn(),
}));

describe('useUsers', () => {
    let queryClient: QueryClient;
    let wrapper: ({ children }: { children: ReactNode }) => ReactNode;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        wrapper = ({ children }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
        vi.clearAllMocks();
    });

    describe('useUsers', () => {
        it('должен вызывать useUsersFindAll с правильными params', () => {
            const mockParams = {
                page: 1,
                limit: 10,
            };
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(usersApi.useUsersFindAll).mockReturnValue(mockReturnValue as any);
            vi.mocked(usersApi.useUsersCreate).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(usersApi.useUsersUpdate).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(usersApi.useUsersRemove).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            const { result } = renderHook(() => useUsers(mockParams), { wrapper });

            expect(usersApi.useUsersFindAll).toHaveBeenCalledWith(mockParams, {
                query: {
                    enabled: true,
                },
            });
            expect(result.current.findAll).toEqual(mockReturnValue);
        });

        it('должен возвращать все необходимые методы', () => {
            vi.mocked(usersApi.useUsersFindAll).mockReturnValue({
                data: null,
                isLoading: false,
                isError: false,
            } as any);
            vi.mocked(usersApi.useUsersCreate).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(usersApi.useUsersUpdate).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(usersApi.useUsersRemove).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            const { result } = renderHook(() => useUsers(), { wrapper });

            expect(result.current.findAll).toBeDefined();
            expect(result.current.create).toBeDefined();
            expect(result.current.update).toBeDefined();
            expect(result.current.remove).toBeDefined();
        });
    });

    describe('useUser', () => {
        it('должен вызывать useUsersFindOne с правильным id', () => {
            const userId = 'test-id';
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(usersApi.useUsersFindOne).mockReturnValue(mockReturnValue as any);

            const { result } = renderHook(() => useUser(userId), { wrapper });

            expect(usersApi.useUsersFindOne).toHaveBeenCalledWith(userId, {
                query: {
                    enabled: true,
                },
            });
            expect(result.current).toEqual(mockReturnValue);
        });

        it('должен отключать запрос когда id undefined', () => {
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(usersApi.useUsersFindOne).mockReturnValue(mockReturnValue as any);

            renderHook(() => useUser(undefined), { wrapper });

            expect(usersApi.useUsersFindOne).toHaveBeenCalledWith('', {
                query: {
                    enabled: false,
                },
            });
        });
    });

    describe('useCreateUser', () => {
        it('должен возвращать mutation объект', () => {
            const mockMutate = vi.fn();
            vi.mocked(usersApi.useUsersCreate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useCreateUser(), { wrapper });

            expect(result.current.mutate).toBeDefined();
            expect(result.current.isPending).toBe(false);
        });
    });

    describe('useUpdateUser', () => {
        it('должен возвращать mutation объект', () => {
            const mockMutate = vi.fn();
            vi.mocked(usersApi.useUsersUpdate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useUpdateUser(), { wrapper });

            expect(result.current.mutate).toBeDefined();
            expect(result.current.isPending).toBe(false);
        });
    });

    describe('useRemoveUser', () => {
        it('должен возвращать mutation объект', () => {
            const mockMutate = vi.fn();
            vi.mocked(usersApi.useUsersRemove).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useRemoveUser(), { wrapper });

            expect(result.current.mutate).toBeDefined();
            expect(result.current.isPending).toBe(false);
        });
    });
});
