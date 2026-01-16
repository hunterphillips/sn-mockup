import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTable } from '../context/DataContext';
import {
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
} from '../api/mockApi';
import {
  SNButton,
  SNInput,
  SNSelect,
  SNTextarea,
  SNCheckbox,
  SNTabs,
} from '../components/sn/common';
import type { SNRecord, FieldDefinition } from '../types';
import {
  ChevronLeft,
  Paperclip,
  HelpCircle,
  Settings,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Form view page for viewing/editing a record
 */
export function FormPage() {
  const { table, sysId } = useParams<{ table: string; sysId: string }>();
  const navigate = useNavigate();
  const tableDef = useTable(table || '');

  const [record, setRecord] = useState<SNRecord | null>(null);
  const [formData, setFormData] = useState<Partial<SNRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isNew = !sysId || sysId === 'new';

  // Fetch record
  useEffect(() => {
    async function fetchRecord() {
      if (!table || isNew) {
        setLoading(false);
        return;
      }

      try {
        const data = await getRecord(table, sysId!);
        setRecord(data);
        setFormData(data || {});
      } catch (error) {
        console.error('Failed to fetch record:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecord();
  }, [table, sysId, isNew]);

  // Handle field change
  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  // Handle save
  const handleSave = async () => {
    if (!table) return;

    setSaving(true);
    try {
      if (isNew) {
        const newRecord = await createRecord(table, formData);
        navigate(`/${table}/${newRecord.sys_id}`, { replace: true });
      } else {
        await updateRecord(table, sysId!, formData);
        setRecord({ ...record, ...formData } as SNRecord);
      }
    } catch (error) {
      console.error('Failed to save record:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!table || !sysId || isNew) return;

    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteRecord(table, sysId);
        navigate(`/${table}/list`);
      } catch (error) {
        console.error('Failed to delete record:', error);
      }
    }
  };

  // Render a form field based on type
  const renderField = (field: FieldDefinition) => {
    const value = formData[field.name] ?? '';
    const isReadonly = field.readonly;

    switch (field.type) {
      case 'text':
        return (
          <SNTextarea
            value={String(value)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={isReadonly}
            rows={4}
            fullWidth
          />
        );

      case 'choice':
        return (
          <SNSelect
            value={String(value)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            options={field.choices?.map((c) => ({ value: c, label: c })) || []}
            disabled={isReadonly}
            fullWidth
          />
        );

      case 'boolean':
        return (
          <SNCheckbox
            checked={Boolean(value)}
            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
            disabled={isReadonly}
          />
        );

      case 'reference':
        return (
          <div className="flex gap-2">
            <SNInput
              value={String(value)}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              disabled={isReadonly}
              lookup
              fullWidth
            />
          </div>
        );

      default:
        return (
          <SNInput
            type={field.type === 'integer' ? 'number' : 'text'}
            value={String(value)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={isReadonly}
            fullWidth
            className={isReadonly ? 'bg-sn-neutral-1' : ''}
          />
        );
    }
  };

  if (!tableDef) {
    return (
      <div className="p-8 text-sn-neutral-6">Table "{table}" not found</div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-spin h-8 w-8 border-4 border-sn-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const recordNumber = String(formData['number'] || (isNew ? 'New' : sysId));

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col">
      {/* Form Header */}
      <div className="bg-white border-b border-sn-neutral-3 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/${table}/list`}>
              <button className="p-1.5 hover:bg-sn-neutral-1 rounded transition-colors">
                <ChevronLeft className="w-5 h-5 text-sn-neutral-7" />
              </button>
            </Link>
            <div className="border-l border-sn-neutral-3 pl-3">
              <div className="text-sm font-medium text-sn-neutral-9">
                {tableDef.label}
              </div>
              <div className="text-xs text-sn-neutral-6">{recordNumber}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-sn-neutral-1 rounded">
              <Paperclip className="w-5 h-5 text-sn-neutral-6" />
            </button>
            <button className="p-2 hover:bg-sn-neutral-1 rounded">
              <HelpCircle className="w-5 h-5 text-sn-neutral-6" />
            </button>
            <button className="p-2 hover:bg-sn-neutral-1 rounded">
              <Settings className="w-5 h-5 text-sn-neutral-6" />
            </button>
            <button className="p-2 hover:bg-sn-neutral-1 rounded">
              <MoreHorizontal className="w-5 h-5 text-sn-neutral-6" />
            </button>

            <div className="flex gap-2 ml-2">
              <SNButton variant="secondary" size="sm">
                Discuss
              </SNButton>
              <SNButton variant="secondary" size="sm">
                Follow
              </SNButton>
              <SNButton
                variant="secondary"
                size="sm"
                onClick={handleSave}
                loading={saving}
              >
                {isNew ? 'Create' : 'Update'}
              </SNButton>
              {!isNew && (
                <SNButton variant="secondary" size="sm" onClick={handleDelete}>
                  Delete
                </SNButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-6 bg-sn-neutral-1">
        <div className="max-w-5xl mx-auto bg-white rounded-sn border border-sn-neutral-3">
          {tableDef.form.sections.map((section, sectionIndex) => {
            const sectionFields = section.fields
              .map((fieldName) =>
                tableDef.fields.find((f) => f.name === fieldName)
              )
              .filter(Boolean) as FieldDefinition[];

            return (
              <div key={section.name} className={cn('p-6')}>
                {section.label && (
                  <h3 className="text-sm font-semibold text-sn-neutral-8 mb-4">
                    {section.label}
                  </h3>
                )}

                <div
                  className={cn(
                    'grid gap-4',
                    section.columns === 2 ? 'grid-cols-2' : 'grid-cols-1'
                  )}
                >
                  {sectionFields.map((field) => (
                    <div key={field.name} className="flex items-start gap-4">
                      <label className="w-32 shrink-0 text-right text-sm text-sn-neutral-7 pt-2">
                        {field.required && (
                          <span className="text-sn-critical">* </span>
                        )}
                        {field.label}
                      </label>
                      <div className="flex-1">{renderField(field)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Related Lists (placeholder) */}
        {!isNew && (
          <div className="max-w-5xl mx-auto mt-6">
            <SNTabs
              tabs={[
                { id: 'notes', label: 'Notes', count: 0 },
                { id: 'related', label: 'Related Records' },
                { id: 'resolution', label: 'Resolution Information' },
              ]}
            />
          </div>
        )}
      </div>

      {/* Form Footer */}
      <div className="bg-white border-t border-sn-neutral-3 px-4 py-3">
        <div className="flex gap-2">
          <SNButton
            variant="secondary"
            size="sm"
            onClick={handleSave}
            loading={saving}
          >
            {isNew ? 'Create' : 'Update'}
          </SNButton>
          {!isNew && (
            <>
              <SNButton variant="secondary" size="sm">
                Resolve
              </SNButton>
              <SNButton variant="secondary" size="sm" onClick={handleDelete}>
                Delete
              </SNButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
