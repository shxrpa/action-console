import { useState, useEffect } from 'react';
import { getFormSchema } from '../services/api';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useEnvironment } from '../contexts/EnvironmentContext';
import type { FormSchema, FormField } from '../services/api';
import './ActionForm.css';

interface ActionFormProps {
  actionId: string;
  onSubmit: (values: Record<string, string>) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function ActionForm({ actionId, onSubmit, onCancel, disabled = false }: ActionFormProps) {
  const { selectedWorkspaceId } = useWorkspace();
  const { selectedEnvironmentId } = useEnvironment();
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingLabels, setEditingLabels] = useState<Record<string, string>>({});
  const [blankFields, setBlankFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFormSchema();
  }, [actionId, selectedWorkspaceId, selectedEnvironmentId]);

  const loadFormSchema = async () => {
    if (!actionId) return;

    setLoading(true);
    try {
      const formSchema = await getFormSchema(
        actionId,
        selectedWorkspaceId || undefined,
        selectedEnvironmentId
      );
      console.log('Loaded form schema:', formSchema);
      setSchema(formSchema);

      // Initialize form values with defaults
      const initialValues: Record<string, string> = {};
      for (const field of formSchema.fields) {
        initialValues[field.variableName] = field.defaultValue;
      }
      setFormValues(initialValues);

      // Load label preferences from localStorage
      const labelPreferences: Record<string, string> = {};
      if (selectedWorkspaceId) {
        for (const field of formSchema.fields) {
          const key = `labelPreference.${selectedWorkspaceId}.${field.variableName}`;
          const saved = localStorage.getItem(key);
          if (saved) {
            labelPreferences[field.variableName] = saved;
          }
        }
      }
      setEditingLabels(labelPreferences);
    } catch (error) {
      console.error('Error loading form schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (variableName: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [variableName]: value }));
    // Clear error for this field
    if (errors[variableName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[variableName];
        return newErrors;
      });
    }
  };

  const handleLabelEdit = (variableName: string, newLabel: string) => {
    setEditingLabels((prev) => ({ ...prev, [variableName]: newLabel }));
    
    // Save to localStorage
    if (selectedWorkspaceId) {
      const key = `labelPreference.${selectedWorkspaceId}.${variableName}`;
      if (newLabel.trim()) {
        localStorage.setItem(key, newLabel);
      } else {
        localStorage.removeItem(key);
      }
    }
  };

  const validate = (): boolean => {
    if (!schema) return false;

    const newErrors: Record<string, string> = {};
    for (const field of schema.fields) {
      const isBlank = blankFields[field.variableName];
      if (field.required && !isBlank && !formValues[field.variableName]?.trim()) {
        newErrors[field.variableName] = 'This field is required';
      }

      // Validate number type (skip if blank)
      if (!isBlank && field.inputType === 'number' && formValues[field.variableName]) {
        const numValue = Number(formValues[field.variableName]);
        if (isNaN(numValue)) {
          newErrors[field.variableName] = 'Must be a valid number';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlankToggle = (variableName: string, checked: boolean) => {
    setBlankFields((prev) => ({ ...prev, [variableName]: checked }));
    if (checked) {
      setFormValues((prev) => ({ ...prev, [variableName]: '' }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[variableName];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Submit with current values (blank fields are '' and will be stripped by backend)
      onSubmit(formValues);
    }
  };

  const getFieldLabel = (field: FormField): string => {
    return editingLabels[field.variableName] || field.label;
  };

  if (loading) {
    return <div className="action-form-loading">Loading form...</div>;
  }

  if (!schema || schema.fields.length === 0) {
    return (
      <div className="action-form-empty">
        <p>This action has no variables to configure.</p>
        <button className="btn btn-primary" onClick={() => onSubmit({})}>
          Run Action
        </button>
      </div>
    );
  }

  return (
    <form className="action-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3>Configure Variables</h3>
        <p className="form-description">Enter values for the variables used in this action.</p>
      </div>

      <div className="form-fields">
        {schema.fields.map((field) => {
          const displayLabel = getFieldLabel(field);
          const hasError = !!errors[field.variableName];

          return (
            <div key={field.variableName} className={`form-field ${hasError ? 'has-error' : ''}`}>
              <div className="field-label-row">
                <label htmlFor={`field-${field.variableName}`}>
                  {displayLabel}
                  {field.required && <span className="required-asterisk">*</span>}
                </label>
                <button
                  type="button"
                  className="label-edit-btn"
                  onClick={() => {
                    const currentLabel = editingLabels[field.variableName] || field.label;
                    const newLabel = prompt('Edit label:', currentLabel);
                    if (newLabel !== null) {
                      handleLabelEdit(field.variableName, newLabel);
                    }
                  }}
                  title="Edit label"
                >
                  ✏️
                </button>
              </div>
              {field.description && (
                <p className="field-description" title={field.description}>
                  {field.description}
                </p>
              )}
              <input
                id={`field-${field.variableName}`}
                type={field.inputType}
                value={formValues[field.variableName] || ''}
                onChange={(e) => handleInputChange(field.variableName, e.target.value)}
                placeholder={blankFields[field.variableName] ? '(leave blank)' : `Enter ${displayLabel.toLowerCase()}`}
                required={field.required && !blankFields[field.variableName]}
                disabled={blankFields[field.variableName]}
                className={hasError ? 'error' : ''}
              />
              <label className="blank-checkbox">
                <input
                  type="checkbox"
                  checked={!!blankFields[field.variableName]}
                  onChange={(e) => handleBlankToggle(field.variableName, e.target.checked)}
                />
                Leave blank
              </label>
              {hasError && <span className="field-error">{errors[field.variableName]}</span>}
              {field.locations.length > 0 && (
                <span className="field-locations">
                  Used in: {field.locations.join(', ')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={disabled}>
          {disabled ? 'Executing...' : 'Run Action'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={disabled}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
