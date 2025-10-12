import React, { memo, useCallback } from 'react';
import { DietaryRestriction } from '../../types/DietaryRestriction';
import { RestrictionCard } from './RestrictionCard';

interface OptimizedRestrictionCardProps {
  restriction: DietaryRestriction;
  onUpdate: (id: string, updates: Partial<DietaryRestriction>) => void;
  onDelete: (id: string) => void;
}

export const OptimizedRestrictionCard = memo<OptimizedRestrictionCardProps>(({
  restriction,
  onUpdate,
  onDelete,
}) => {
  const handleUpdate = useCallback(
    (updates: Partial<DietaryRestriction>) => {
      onUpdate(restriction.id, updates);
    },
    [restriction.id, onUpdate]
  );

  const handleDelete = useCallback(() => {
    onDelete(restriction.id);
  }, [restriction.id, onDelete]);

  return (
    <RestrictionCard
      restriction={restriction}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.restriction.id === nextProps.restriction.id &&
    prevProps.restriction.severity === nextProps.restriction.severity &&
    prevProps.restriction.notes === nextProps.restriction.notes &&
    prevProps.restriction.allergen === nextProps.restriction.allergen
  );
});
