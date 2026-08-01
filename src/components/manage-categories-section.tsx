import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Archive, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveFormSheet } from '@/components/responsive-form-sheet';
import { categoriesService } from '@/services/categoriesService';
import { Category } from '@/types/category';

interface ManageCategoriesSectionProps {
  boardId: string;
}

interface CategoryFormState {
  name: string;
  icon: string;
  color: string;
}

const emptyForm: CategoryFormState = {
  name: '',
  icon: '',
  color: '',
};

export function ManageCategoriesSection({
  boardId,
}: ManageCategoriesSectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormState>(emptyForm);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const { categories: fetched } =
        await categoriesService.getByBoard(boardId);
      setCategories(fetched);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al cargar las categorías',
      );
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditingCategory(null);
    setFormData(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon || '',
      color: category.color || '',
    });
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast.error('El nombre debe tener al menos 2 caracteres');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        await categoriesService.update(editingCategory._id, {
          name: formData.name.trim(),
          icon: formData.icon.trim() || undefined,
          color: formData.color.trim() || undefined,
        });
        toast.success('Categoría actualizada');
      } else {
        await categoriesService.create({
          boardId,
          name: formData.name.trim(),
          icon: formData.icon.trim() || undefined,
          color: formData.color.trim() || undefined,
        });
        toast.success('Categoría creada');
      }
      setSheetOpen(false);
      setEditingCategory(null);
      setFormData(emptyForm);
      await fetchCategories();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al guardar la categoría',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (category: Category) => {
    if (
      !confirm(
        `¿Archivar la categoría "${category.name}"? Los gastos existentes no se borran.`,
      )
    ) {
      return;
    }

    try {
      await categoriesService.archive(category._id);
      toast.success('Categoría archivada');
      await fetchCategories();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message || 'Error al archivar la categoría',
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Categorías</h3>
          <p className="text-sm text-muted-foreground">
            Organizá los gastos del tablero activo.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Nueva
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando categorías…</p>
      ) : categories.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay categorías activas. Creá la primera o revisá que el tablero
          tenga el seed del backend.
        </p>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li
              key={category._id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {category.color ? (
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                      aria-hidden
                    />
                  ) : null}
                  <span className="font-medium">{category.name}</span>
                  {category.isDefault ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Default
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => openEdit(category)}
                  aria-label={`Editar ${category.name}`}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => handleArchive(category)}
                  aria-label={`Archivar ${category.name}`}
                >
                  <Archive className="size-4 text-muted-foreground" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ResponsiveFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
        description="Nombre visible al registrar gastos en este tablero."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nombre *</Label>
            <Input
              id="category-name"
              value={formData.name}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Ej: Supermercado"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-icon">Icono (opcional)</Label>
            <Input
              id="category-icon"
              value={formData.icon}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, icon: event.target.value }))
              }
              placeholder="utensils"
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-color">Color (opcional)</Label>
            <Input
              id="category-color"
              value={formData.color}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, color: event.target.value }))
              }
              placeholder="#f97316"
              disabled={isSaving}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving
                ? 'Guardando…'
                : editingCategory
                  ? 'Actualizar'
                  : 'Crear'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </ResponsiveFormSheet>
    </div>
  );
}
