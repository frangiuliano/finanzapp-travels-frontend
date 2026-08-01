import { Link } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManageCategoriesSection } from '@/components/manage-categories-section';
import { ManagePaymentMethodsSection } from '@/components/manage-payment-methods-section';
import { useBoardsStore } from '@/store/boardsStore';

export default function BoardSettingsPage() {
  const currentBoard = useBoardsStore((state) => state.currentBoard);
  const boards = useBoardsStore((state) => state.boards);
  const activeBoard = currentBoard || boards[0] || null;

  if (!activeBoard) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Settings2 className="size-7" />
        </div>
        <h2 className="font-display text-2xl font-bold">
          Configuración del tablero
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Necesitás un tablero activo para gestionar categorías y medios de
          pago. Creá uno desde el wizard de onboarding.
        </p>
        <Button asChild className="rounded-xl">
          <Link to="/onboarding">Crear tablero</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:px-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Configuración del tablero
        </h1>
        <p className="text-sm text-muted-foreground">
          Categorías y medios de pago para{' '}
          <span className="font-medium text-foreground">
            {activeBoard.name}
          </span>
          .
        </p>
      </div>

      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">Organización</CardTitle>
          <CardDescription>
            Gestioná cómo clasificás gastos y con qué medios pagás en este
            tablero.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="categories">Categorías</TabsTrigger>
              <TabsTrigger value="payment-methods">Medios de pago</TabsTrigger>
            </TabsList>
            <TabsContent value="categories">
              <ManageCategoriesSection boardId={activeBoard._id} />
            </TabsContent>
            <TabsContent value="payment-methods">
              <ManagePaymentMethodsSection boardId={activeBoard._id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
