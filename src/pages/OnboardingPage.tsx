import { OnboardingWizard } from '@/components/onboarding-wizard';
import { useBoardsStore } from '@/store/boardsStore';
import { isBoardMocksEnabled } from '@/services/boardsService';

export default function OnboardingPage() {
  const boards = useBoardsStore((state) => state.boards);
  const bootstrapStatus = useBoardsStore((state) => state.bootstrapStatus);

  if (
    bootstrapStatus !== 'ready' &&
    boards.length === 0 &&
    !isBoardMocksEnabled()
  ) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
        Cargando…
      </div>
    );
  }

  return <OnboardingWizard />;
}
