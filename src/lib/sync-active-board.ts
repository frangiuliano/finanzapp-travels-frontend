import { userPreferencesService } from '@/services/userPreferencesService';
import { useAuthStore } from '@/store/authStore';

export async function syncTelegramActiveBoard(
  boardId: string | null,
): Promise<void> {
  const { isAuthenticated, user } = useAuthStore.getState();
  if (!isAuthenticated) return;

  const current = user?.activeBoardId ?? null;
  if (current === boardId) return;

  const result = await userPreferencesService.updatePreferences({
    activeBoardId: boardId,
  });

  const accessToken = useAuthStore.getState().accessToken;
  if (user && accessToken) {
    useAuthStore
      .getState()
      .setAuth({ ...user, activeBoardId: result.activeBoardId }, accessToken);
  }
}
