import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CreateCardDto, CardType } from '@/types/card';
import { cardsService } from '@/services/cardsService';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { Trash2, Plus, Pencil } from 'lucide-react';
import { UpdateCardDto } from '@/types/card';

interface ManageCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId?: string;
  onSuccess?: () => void;
}

export function ManageCardsDialog({
  open,
  onOpenChange,
  tripId,
  onSuccess,
}: ManageCardsDialogProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateCardDto>({
    name: '',
    lastFourDigits: '',
    type: CardType.OTHER,
  });

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = tripId
        ? await cardsService.getCardsByTrip(tripId)
        : await cardsService.getCards();
      setCards(result.cards || []);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error('Error al cargar tarjetas:', error);
      const errorMessage =
        axiosError.response?.data?.message || 'Error al cargar las tarjetas';
      toast.error(errorMessage);
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (open) {
      fetchCards();
    }
  }, [open, fetchCards]);

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.lastFourDigits.trim()) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (!/^\d{4}$/.test(formData.lastFourDigits)) {
      toast.error('Los últimos 4 dígitos deben ser números');
      return;
    }

    setIsCreating(true);
    try {
      const createData: CreateCardDto = {
        ...formData,
        tripId: tripId || undefined,
      };
      await cardsService.createCard(createData);
      toast.success('Tarjeta creada exitosamente');
      setFormData({
        name: '',
        lastFourDigits: '',
        type: CardType.OTHER,
      });
      setShowCreateForm(false);
      fetchCards();
      onSuccess?.();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al crear la tarjeta',
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (card: Card) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      lastFourDigits: card.lastFourDigits,
      type: card.type,
    });
    setShowCreateForm(false);
  };

  const handleUpdate = async () => {
    if (!editingCard) return;

    if (!formData.name.trim() || !formData.lastFourDigits.trim()) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (!/^\d{4}$/.test(formData.lastFourDigits)) {
      toast.error('Los últimos 4 dígitos deben ser números');
      return;
    }

    setIsUpdating(true);
    try {
      const updateData: UpdateCardDto = {
        ...formData,
        tripId: tripId || undefined,
      };
      await cardsService.updateCard(editingCard._id, updateData);
      toast.success('Tarjeta actualizada exitosamente');
      setEditingCard(null);
      setFormData({
        name: '',
        lastFourDigits: '',
        type: CardType.OTHER,
      });
      fetchCards();
      onSuccess?.();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al actualizar la tarjeta',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setFormData({
      name: '',
      lastFourDigits: '',
      type: CardType.OTHER,
    });
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarjeta?')) {
      return;
    }

    try {
      await cardsService.deleteCard(cardId);
      toast.success('Tarjeta eliminada exitosamente');
      fetchCards();
      onSuccess?.();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al eliminar la tarjeta',
      );
    }
  };

  const getCardTypeLabel = (type: CardType): string => {
    const labels: Record<CardType, string> = {
      [CardType.VISA]: 'Visa',
      [CardType.MASTERCARD]: 'Mastercard',
      [CardType.AMEX]: 'American Express',
      [CardType.OTHER]: 'Otra',
    };
    return labels[type] || 'Otra';
  };

  const getCardOwnerName = (card: Card): string => {
    if (card.user) {
      return `${card.user.firstName} ${card.user.lastName}`;
    }
    return 'Usuario';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Tarjetas</DialogTitle>
          <DialogDescription>
            {tripId
              ? 'Tarjetas disponibles para este viaje (propias y de otros participantes)'
              : 'Gestiona tus tarjetas personales'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tarjetas</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (editingCard) {
                  handleCancelEdit();
                } else {
                  setShowCreateForm(!showCreateForm);
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {editingCard ? 'Cancelar Edición' : 'Nueva Tarjeta'}
            </Button>
          </div>

          {(showCreateForm || editingCard) && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <h4 className="font-medium">
                {editingCard ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName">Nombre *</Label>
                  <Input
                    id="cardName"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Tarjeta Principal"
                    disabled={isCreating || isUpdating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastFourDigits">Últimos 4 dígitos *</Label>
                  <Input
                    id="lastFourDigits"
                    value={formData.lastFourDigits}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lastFourDigits: e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 4),
                      })
                    }
                    placeholder="1234"
                    maxLength={4}
                    disabled={isCreating || isUpdating}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardType">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as CardType })
                  }
                  disabled={isCreating || isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CardType.VISA}>Visa</SelectItem>
                    <SelectItem value={CardType.MASTERCARD}>
                      Mastercard
                    </SelectItem>
                    <SelectItem value={CardType.AMEX}>
                      American Express
                    </SelectItem>
                    <SelectItem value={CardType.OTHER}>Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={editingCard ? handleUpdate : handleCreate}
                  disabled={isCreating || isUpdating}
                >
                  {editingCard
                    ? isUpdating
                      ? 'Actualizando...'
                      : 'Actualizar'
                    : isCreating
                      ? 'Creando...'
                      : 'Crear'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    handleCancelEdit();
                  }}
                  disabled={isCreating || isUpdating}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay tarjetas registradas
            </p>
          ) : (
            <div className="space-y-2">
              {cards.map((card) => (
                <div
                  key={card._id}
                  className="flex items-center justify-between border rounded-lg p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{card.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ****{card.lastFourDigits}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({getCardTypeLabel(card.type)})
                      </span>
                    </div>
                    {tripId && card.user && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Propietario: {getCardOwnerName(card)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(card)}
                      disabled={editingCard?._id === card._id}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(card._id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
