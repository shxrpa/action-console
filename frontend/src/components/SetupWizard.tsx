import { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useEnvironment } from '../contexts/EnvironmentContext';
import { createVariable, type Action, type VariableRef } from '../services/api';
import type { CreateVariableRequest } from '../types';
import './SetupWizard.css';

interface SetupWizardProps {
  action: Action;
  missingVariables: string[];
  onComplete: () => void;
  onCancel: () => void;
}

export function SetupWizard({ action, missingVariables, onComplete, onCancel }: SetupWizardProps) {
  const { selectedWorkspaceId } = useWorkspace();
  const { selectedEnvironmentId } = useEnvironment();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, { value: string; isSecret: boolean }>>({});
  const [blankFields, setBlankFields] = useState<Record<string, boolean>>({});
  const [scope, setScope] = useState<'workspace' | 'environment'>('workspace');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize form data for missing variables
    const initialData: Record<string, { value: string; isSecret: boolean }> = {};
    for (const varName of missingVariables) {
      initialData[varName] = { value: '', isSecret: false };
    }
    setFormData(initialData);
  }, [missingVariables]);

  const getVariableRef = (name: string): VariableRef | undefined => {
    return action.variables?.find((v: VariableRef) => v.name === name);
  };

  const detectInputType = (variableName: string): 'text' | 'password' => {
    const lower = variableName.toLowerCase();
    if (lower.includes('secret') || lower.includes('password') || lower.includes('token') || lower.includes('key')) {
      return 'password';
    }
    return 'text';
  };

  const generateLabel = (variableName: string): string => {
    // Convert camelCase/PascalCase to Title Case
    let label = variableName
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .trim();
    // Capitalize first letter
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const handleInputChange = (varName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [varName]: { ...prev[varName], value },
    }));
  };

  const handleSecretToggle = (varName: string) => {
    setFormData((prev) => ({
      ...prev,
      [varName]: { ...prev[varName], isSecret: !prev[varName].isSecret },
    }));
  };

  const handleBlankToggle = (varName: string, checked: boolean) => {
    setBlankFields((prev) => ({ ...prev, [varName]: checked }));
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        [varName]: { ...prev[varName], value: '' },
      }));
    }
  };

  const handleNext = () => {
    if (step === 1) {
      // Step 1 is just a review - no validation needed, just proceed to step 2
      setStep(2);
    }
  };

  const handleSave = async () => {
    if (!selectedWorkspaceId) {
      alert('No workspace selected');
      return;
    }

    // Validate: each field is either filled or marked blank
    const allFilled = missingVariables.every(
      (name) => blankFields[name] || formData[name]?.value?.trim()
    );
    if (!allFilled) {
      alert('Please fill in all required variables or check "Leave blank" for optional ones.');
      return;
    }

    setSaving(true);
    try {
      // Create all variables (blank ones get empty string)
      const promises = missingVariables.map((varName) => {
        const data: CreateVariableRequest = {
          name: varName,
          value: blankFields[varName] ? '' : formData[varName].value,
          isSecret: formData[varName].isSecret,
          scope,
          environmentId: scope === 'environment' ? (selectedEnvironmentId ?? null) : null,
        };
        return createVariable(selectedWorkspaceId, data);
      });

      await Promise.all(promises);
      onComplete();
    } catch (error) {
      console.error('Error saving variables:', error);
      alert('Failed to save variables. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="setup-wizard-overlay">
      <div className="setup-wizard">
        <div className="wizard-header">
          <h2>Setup Required Variables</h2>
          <button className="wizard-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="wizard-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Review</div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Configure</div>
        </div>

        {step === 1 && (
          <div className="wizard-step">
            <h3>Missing Required Variables</h3>
            <p>The following variables are required to run this action:</p>
            <ul className="missing-variables-list">
              {missingVariables.map((varName) => {
                const varRef = getVariableRef(varName);
                return (
                  <li key={varName}>
                    <strong>{generateLabel(varName)}</strong>
                    {varRef?.description && (
                      <p className="variable-description">{varRef.description}</p>
                    )}
                    {varRef && (
                      <span className="variable-locations">
                        Used in: {varRef.locations.join(', ')}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="wizard-actions">
              <button className="btn btn-primary" onClick={handleNext}>
                Next: Configure Values
              </button>
              <button className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step">
            <h3>Configure Variable Values</h3>
            <div className="wizard-form">
              {missingVariables.map((varName) => {
                const varRef = getVariableRef(varName);
                const inputType = detectInputType(varName);
                const isSecret = formData[varName]?.isSecret || inputType === 'password';
                const isBlank = blankFields[varName];
                return (
                  <div key={varName} className="form-group">
                    <label htmlFor={`var-${varName}`}>
                      {generateLabel(varName)}
                      {varRef?.required && !isBlank && <span className="required">*</span>}
                    </label>
                    {varRef?.description && (
                      <p className="variable-description">{varRef.description}</p>
                    )}
                    <div className="input-with-toggle">
                      <input
                        id={`var-${varName}`}
                        type={isSecret ? 'password' : 'text'}
                        value={formData[varName]?.value || ''}
                        onChange={(e) => handleInputChange(varName, e.target.value)}
                        required={!isBlank}
                        disabled={isBlank}
                        placeholder={isBlank ? '(leave blank)' : `Enter ${generateLabel(varName).toLowerCase()}`}
                      />
                      <label className="secret-toggle">
                        <input
                          type="checkbox"
                          checked={isSecret}
                          onChange={() => handleSecretToggle(varName)}
                        />
                        Secret
                      </label>
                      <label className="blank-toggle">
                        <input
                          type="checkbox"
                          checked={isBlank}
                          onChange={(e) => handleBlankToggle(varName, e.target.checked)}
                        />
                        Leave blank
                      </label>
                    </div>
                  </div>
                );
              })}

              <div className="form-group">
                <label htmlFor="scope">Storage Scope</label>
                <select
                  id="scope"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as 'workspace' | 'environment')}
                >
                  <option value="workspace">Workspace (available to all environments)</option>
                  <option value="environment">Environment (only for current environment)</option>
                </select>
              </div>
            </div>

            <div className="wizard-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Variables'}
              </button>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
