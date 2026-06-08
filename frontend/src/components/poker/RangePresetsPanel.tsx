/**
 * RangePresetsPanel
 * ─────────────────
 * Premium-only range preset manager.
 * – Lists user presets with 1-click activate
 * – Inline editor with per-position RangeEditor tabs
 * – Optional stack filter (highlights matching presets)
 * – Built-in starting templates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Plus, Edit2, Trash2, Check, Save, X,
  ChevronDown, ChevronUp, Layers, Zap, SlidersHorizontal,
} from 'lucide-react';
import { RangeEditor } from './RangeEditor';
import { presetsApi, rangesApi, RangePreset, PresetInput } from '../../services/api';
import { Button } from '../ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

type PanelMode = 'preflop' | 'bbdefense';

interface Props {
  mode: PanelMode;
  isPremium: boolean;
  isEn: boolean;
  alwaysOpen?: boolean;
}

interface Draft {
  id?: string;
  name: string;
  description: string;
  useStack: boolean;
  stackMin: number;
  stackMax: number;
  data: Record<string, number[][]>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PREFLOP_POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
const BB_POSITIONS      = ['BB'];

// Built-in starting templates (name + description only — data comes from GTO defaults)
const TEMPLATES_FR = [
  { key: 'cash',  name: 'Cash Game GTO',        description: 'Ranges GTO standards pour 6-max cash game 100bb',           stackMin: null, stackMax: null },
  { key: 'early', name: 'Tournoi — Début',       description: 'Jeu serré en profondeur de stack (50bb+)',                  stackMin: 50,   stackMax: null },
  { key: 'mid',   name: 'Tournoi — Milieu',      description: 'Pression de stack moyen, plus agressif en position (20-50bb)', stackMin: 20, stackMax: 50 },
  { key: 'late',  name: 'Tournoi — Final',       description: 'Stratégie push/fold en petit stack (<20bb)',                stackMin: null, stackMax: 20 },
];
const TEMPLATES_EN = [
  { key: 'cash',  name: 'Cash Game GTO',         description: 'Standard GTO ranges for 6-max cash game 100bb',            stackMin: null, stackMax: null },
  { key: 'early', name: 'Tournament — Early',    description: 'Tight deep-stack play (50bb+)',                             stackMin: 50,   stackMax: null },
  { key: 'mid',   name: 'Tournament — Middle',   description: 'Mid-stack pressure, more aggressive in position (20-50bb)', stackMin: 20,  stackMax: 50 },
  { key: 'late',  name: 'Tournament — Final',    description: 'Push/fold short-stack strategy (<20bb)',                   stackMin: null, stackMax: 20 },
];

function emptyMatrix(): number[][] {
  return Array.from({ length: 13 }, () => Array(13).fill(0));
}

function emptyData(positions: string[]): Record<string, number[][]> {
  return Object.fromEntries(positions.map(p => [p, emptyMatrix()]));
}

function stackLabel(min: number | null, max: number | null, isEn: boolean): string {
  if (min === null && max === null) return isEn ? 'All stacks' : 'Tout stack';
  if (min !== null && max === null) return `${min}bb+`;
  if (min === null && max !== null) return `< ${max}bb`;
  return `${min}–${max}bb`;
}

function matchesStack(preset: RangePreset, stack: number): boolean {
  if (preset.stackMin !== null && stack < preset.stackMin) return false;
  if (preset.stackMax !== null && stack > preset.stackMax) return false;
  return true;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RangePresetsPanel({ mode, isPremium, isEn, alwaysOpen }: Props) {
  const [open, setOpen]         = useState(false);
  const [presets, setPresets]   = useState<RangePreset[]>([]);
  const [loading, setLoading]   = useState(false);
  const [view, setView]         = useState<'list' | 'edit' | 'new'>('list');
  const [draft, setDraft]       = useState<Draft | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stack, setStack]       = useState<number>(100);
  const [defaults, setDefaults] = useState<Record<string, number[][]> | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);

  const positions = mode === 'preflop' ? PREFLOP_POSITIONS : BB_POSITIONS;
  const templates = isEn ? TEMPLATES_EN : TEMPLATES_FR;

  // ── Load presets ───────────────────────────────────────────────────────────

  const loadPresets = useCallback(async () => {
    if (!isPremium) return;
    setLoading(true);
    try {
      const data = await presetsApi.list();
      setPresets(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [isPremium]);

  useEffect(() => {
    if ((open || alwaysOpen) && isPremium) loadPresets();
  }, [open, alwaysOpen, isPremium, loadPresets]);

  // ── Load GTO defaults (used as starting point for new presets) ────────────

  const loadDefaults = useCallback(async () => {
    if (defaults) return;
    try {
      const d = await rangesApi.getDefaults();
      setDefaults(d);
    } catch { /* ignore */ }
  }, [defaults]);

  // ── Preset activation ──────────────────────────────────────────────────────

  const handleActivate = async (id: string) => {
    const already = presets.find(p => p.id === id)?.isActive;
    setActivating(id);
    try {
      if (already) {
        await presetsApi.deactivate();
        setPresets(ps => ps.map(p => ({ ...p, isActive: false })));
      } else {
        await presetsApi.activate(id);
        setPresets(ps => ps.map(p => ({ ...p, isActive: p.id === id })));
      }
    } catch { /* ignore */ }
    setActivating(null);
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      await presetsApi.delete(id);
      setPresets(ps => ps.filter(p => p.id !== id));
    } catch { /* ignore */ }
    setDeleteId(null);
  };

  // ── Open editor ────────────────────────────────────────────────────────────

  const openNew = async (template?: typeof TEMPLATES_FR[0]) => {
    await loadDefaults();
    const baseData: Record<string, number[][]> = {};
    for (const pos of positions) {
      baseData[pos] = defaults?.[pos]
        ? defaults[pos].map(row => [...row])
        : emptyMatrix();
    }
    setDraft({
      name:        template?.name        ?? (isEn ? 'My Range' : 'Ma Range'),
      description: template?.description ?? '',
      useStack:    !!(template?.stackMin !== null || template?.stackMax !== null),
      stackMin:    template?.stackMin ?? 0,
      stackMax:    template?.stackMax ?? 200,
      data:        baseData,
    });
    setActiveTab(positions[0]);
    setShowTemplates(false);
    setView('new');
  };

  const openEdit = async (preset: RangePreset) => {
    await loadDefaults();
    const baseData: Record<string, number[][]> = {};
    for (const pos of positions) {
      baseData[pos] = preset.data[pos]
        ? preset.data[pos].map(row => [...row])
        : defaults?.[pos]?.map(row => [...row]) ?? emptyMatrix();
    }
    setDraft({
      id:          preset.id,
      name:        preset.name,
      description: preset.description,
      useStack:    preset.stackMin !== null || preset.stackMax !== null,
      stackMin:    preset.stackMin ?? 0,
      stackMax:    preset.stackMax ?? 200,
      data:        baseData,
    });
    setActiveTab(positions[0]);
    setView('edit');
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      const input: PresetInput = {
        name:        draft.name,
        description: draft.description,
        stackMin:    draft.useStack ? draft.stackMin : null,
        stackMax:    draft.useStack ? draft.stackMax : null,
        data:        draft.data,
      };
      if (draft.id) {
        const updated = await presetsApi.update(draft.id, input);
        setPresets(ps => ps.map(p => p.id === draft.id ? updated : p));
      } else {
        const created = await presetsApi.create(input);
        setPresets(ps => [...ps, created]);
      }
      setView('list');
      setDraft(null);
    } catch { /* ignore */ }
    setIsSaving(false);
  };

  const handleCancel = () => { setView('list'); setDraft(null); };

  // ── Range edit ────────────────────────────────────────────────────────────

  const updateDraftMatrix = (pos: string, matrix: number[][]) => {
    setDraft(d => d ? { ...d, data: { ...d.data, [pos]: matrix } } : d);
  };

  // Reset a tab to GTO defaults
  const resetTab = () => {
    if (!draft || !defaults) return;
    updateDraftMatrix(activeTab, defaults[activeTab].map(r => [...r]));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const title = isEn ? 'My Ranges' : 'Mes Ranges';

  const isOpen = alwaysOpen || open;

  return (
    <div className="w-full border border-gray-700 rounded-2xl bg-gray-900/60 overflow-hidden">

      {/* Header / toggle — hidden when alwaysOpen */}
      {!alwaysOpen && (
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Layers size={16} className="text-gold-400" />
            <span className="font-bold text-white text-sm">{title}</span>
            {!isPremium && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-gold-900/40 text-gold-300 border border-gold-700 px-1.5 py-0.5 rounded-full">
                <Crown size={9} /> Premium
              </span>
            )}
            {isPremium && presets.some(p => p.isActive) && (
              <span className="flex items-center gap-1 text-[10px] font-semibold bg-green-900/40 text-green-300 border border-green-700 px-1.5 py-0.5 rounded-full">
                <Check size={9} /> {isEn ? 'Custom active' : 'Perso actif'}
              </span>
            )}
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
      )}

      {/* Body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={alwaysOpen ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={alwaysOpen ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-5 pt-1 ${alwaysOpen ? '' : 'border-t border-gray-700/60'}`}>

              {/* ── Premium gate ── */}
              {!isPremium && <PremiumGate isEn={isEn} />}

              {/* ── List view ── */}
              {isPremium && view === 'list' && (
                <div className="flex flex-col gap-4 mt-3">

                  {/* Stack slider */}
                  <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-4 py-2.5">
                    <SlidersHorizontal size={14} className="text-blue-400 shrink-0" />
                    <span className="text-xs text-gray-400 shrink-0">
                      {isEn ? 'Current stack' : 'Stack actuel'}
                    </span>
                    <input
                      type="range" min={5} max={200} step={5}
                      value={stack}
                      onChange={e => setStack(Number(e.target.value))}
                      className="flex-1 accent-blue-500"
                    />
                    <span className="text-xs font-bold text-blue-300 w-12 text-right shrink-0">
                      {stack}bb
                    </span>
                  </div>

                  {/* Presets list */}
                  {loading ? (
                    <div className="flex justify-center py-6">
                      <div className="h-6 w-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : presets.length === 0 ? (
                    <EmptyState isEn={isEn} onNew={() => setShowTemplates(true)} />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {presets.map(preset => (
                        <PresetCard
                          key={preset.id}
                          preset={preset}
                          isEn={isEn}
                          stack={stack}
                          activating={activating}
                          deleteId={deleteId}
                          onActivate={() => handleActivate(preset.id)}
                          onEdit={() => openEdit(preset)}
                          onDelete={() => setDeleteId(preset.id)}
                          onDeleteConfirm={() => handleDelete(preset.id)}
                          onDeleteCancel={() => setDeleteId(null)}
                        />
                      ))}
                    </div>
                  )}

                  {/* New preset button + templates */}
                  {presets.length > 0 && !showTemplates && (
                    <button
                      onClick={() => setShowTemplates(t => !t)}
                      className="flex items-center gap-2 text-sm text-gold-400 hover:text-gold-300 font-semibold self-start"
                    >
                      <Plus size={15} />
                      {isEn ? 'New preset' : 'Nouveau preset'}
                    </button>
                  )}

                  {/* Template picker */}
                  {(presets.length === 0 || showTemplates) && (
                    <TemplatePicker
                      templates={templates}
                      isEn={isEn}
                      onPick={openNew}
                      onBlank={() => openNew()}
                    />
                  )}
                </div>
              )}

              {/* ── Editor view ── */}
              {isPremium && (view === 'edit' || view === 'new') && draft && (
                <PresetEditorView
                  draft={draft}
                  positions={positions}
                  activeTab={activeTab}
                  isEn={isEn}
                  isSaving={isSaving}
                  onTabChange={setActiveTab}
                  onNameChange={n => setDraft(d => d ? { ...d, name: n } : d)}
                  onDescChange={d2 => setDraft(d => d ? { ...d, description: d2 } : d)}
                  onStackToggle={v => setDraft(d => d ? { ...d, useStack: v } : d)}
                  onStackMin={v => setDraft(d => d ? { ...d, stackMin: v } : d)}
                  onStackMax={v => setDraft(d => d ? { ...d, stackMax: v } : d)}
                  onMatrixChange={updateDraftMatrix}
                  onResetTab={resetTab}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PremiumGate({ isEn }: { isEn: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 px-4 text-center">
      <div className="flex items-center gap-2 text-gold-400">
        <Crown size={22} />
        <span className="font-bold text-lg">Premium</span>
      </div>
      <p className="text-sm text-gray-400 max-w-xs">
        {isEn
          ? 'Customize your own GTO ranges, save multiple presets (early / mid / late tournament, stack-adaptive), and switch them in one click.'
          : "Personnalisez vos propres ranges GTO, sauvegardez plusieurs presets (début / milieu / fin de tournoi, adaptatifs au stack), et basculez d'un clic."}
      </p>
      <div className="flex flex-col gap-1.5 text-xs text-gray-500">
        <Feature isEn={isEn} text={isEn ? "Edit any position's range cell by cell" : 'Modifiez chaque cellule de chaque position'} />
        <Feature isEn={isEn} text={isEn ? 'Multiple named presets with 1-click switch' : 'Presets nommés avec bascule en 1 clic'} />
        <Feature isEn={isEn} text={isEn ? 'Stack-adaptive suggestions' : 'Suggestions adaptatives au stack'} />
      </div>
    </div>
  );
}

function Feature({ text }: { isEn: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Check size={12} className="text-gold-500 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function EmptyState({ isEn, onNew }: { isEn: boolean; onNew: () => void }) {
  return (
    <div className="text-center py-4">
      <p className="text-gray-400 text-sm mb-3">
        {isEn ? 'No presets yet. Start from a template:' : 'Aucun preset. Partez d\'un modèle :'}
      </p>
    </div>
  );
}

function PresetCard({
  preset, isEn, stack, activating, deleteId,
  onActivate, onEdit, onDelete, onDeleteConfirm, onDeleteCancel,
}: {
  preset: RangePreset; isEn: boolean; stack: number;
  activating: string | null; deleteId: string | null;
  onActivate: () => void; onEdit: () => void;
  onDelete: () => void; onDeleteConfirm: () => void; onDeleteCancel: () => void;
}) {
  const matches = matchesStack(preset, stack);
  const isDeleting = deleteId === preset.id;

  return (
    <motion.div
      layout
      className={`rounded-xl border px-4 py-3 transition-all ${
        preset.isActive
          ? 'border-green-600 bg-green-900/20'
          : matches
          ? 'border-blue-600/60 bg-blue-900/10'
          : 'border-gray-700 bg-gray-800/40'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm truncate">{preset.name}</span>
            {preset.isActive && (
              <span className="flex items-center gap-1 text-[9px] font-bold bg-green-800/60 text-green-300 border border-green-700 px-1.5 py-0.5 rounded-full shrink-0">
                <Check size={8} /> {isEn ? 'ACTIVE' : 'ACTIF'}
              </span>
            )}
            {matches && !preset.isActive && (
              <span className="flex items-center gap-1 text-[9px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700 px-1.5 py-0.5 rounded-full shrink-0">
                <Zap size={8} /> {isEn ? 'matches stack' : 'correspond'}
              </span>
            )}
            <span className="text-[9px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full shrink-0">
              {stackLabel(preset.stackMin, preset.stackMax, isEn)}
            </span>
          </div>
          {preset.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{preset.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onActivate}
            disabled={activating === preset.id}
            className={`p-1.5 rounded-lg transition-colors text-xs font-bold ${
              preset.isActive
                ? 'bg-green-800/60 text-green-300 hover:bg-red-900/40 hover:text-red-300'
                : 'bg-gray-700 text-gray-300 hover:bg-green-800/40 hover:text-green-300'
            }`}
            title={preset.isActive ? (isEn ? 'Deactivate' : 'Désactiver') : (isEn ? 'Activate' : 'Activer')}
          >
            {activating === preset.id
              ? <div className="h-3.5 w-3.5 border border-current border-t-transparent rounded-full animate-spin" />
              : preset.isActive ? <X size={13} /> : <Check size={13} />
            }
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-blue-900/40 hover:text-blue-300 transition-colors"
            title={isEn ? 'Edit' : 'Modifier'}
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-red-900/40 hover:text-red-300 transition-colors"
            title={isEn ? 'Delete' : 'Supprimer'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {isDeleting && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 pt-2 border-t border-gray-700 flex items-center gap-2 flex-wrap"
        >
          <span className="text-xs text-red-400 flex-1">
            {isEn ? 'Delete this preset?' : 'Supprimer ce preset ?'}
          </span>
          <button onClick={onDeleteConfirm} className="text-xs font-bold text-red-300 hover:text-red-200 bg-red-900/40 px-2 py-1 rounded-lg">
            {isEn ? 'Yes, delete' : 'Oui, supprimer'}
          </button>
          <button onClick={onDeleteCancel} className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded-lg">
            {isEn ? 'Cancel' : 'Annuler'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

function TemplatePicker({
  templates, isEn, onPick, onBlank,
}: {
  templates: typeof TEMPLATES_FR;
  isEn: boolean;
  onPick: (t: typeof TEMPLATES_FR[0]) => void;
  onBlank: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
        {isEn ? 'Choose a starting template' : 'Choisir un modèle de départ'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {templates.map(t => (
          <button
            key={t.key}
            onClick={() => onPick(t)}
            className="text-left px-3 py-2.5 rounded-xl border border-gray-600 bg-gray-800/60 hover:border-gold-600 hover:bg-gold-900/20 transition-all group"
          >
            <div className="font-bold text-sm text-white group-hover:text-gold-300 transition-colors">{t.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{t.description}</div>
            {(t.stackMin !== null || t.stackMax !== null) && (
              <div className="text-[10px] text-blue-400 mt-1">
                {stackLabel(t.stackMin, t.stackMax, isEn)}
              </div>
            )}
          </button>
        ))}
        <button
          onClick={onBlank}
          className="text-left px-3 py-2.5 rounded-xl border border-dashed border-gray-600 bg-gray-800/30 hover:border-gray-400 transition-all group"
        >
          <div className="font-bold text-sm text-gray-400 group-hover:text-white transition-colors">
            {isEn ? 'Blank preset' : 'Preset vierge'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {isEn ? 'Start from GTO base' : 'Partir des ranges GTO de base'}
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Preset editor ────────────────────────────────────────────────────────────

function PresetEditorView({
  draft, positions, activeTab, isEn, isSaving,
  onTabChange, onNameChange, onDescChange,
  onStackToggle, onStackMin, onStackMax,
  onMatrixChange, onResetTab, onSave, onCancel,
}: {
  draft: Draft;
  positions: string[];
  activeTab: string;
  isEn: boolean;
  isSaving: boolean;
  onTabChange: (p: string) => void;
  onNameChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onStackToggle: (v: boolean) => void;
  onStackMin: (v: number) => void;
  onStackMax: (v: number) => void;
  onMatrixChange: (pos: string, m: number[][]) => void;
  onResetTab: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 mt-3">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
          <X size={16} />
        </button>
        <h3 className="font-bold text-white text-sm flex-1">
          {draft.id
            ? (isEn ? 'Edit preset' : 'Modifier le preset')
            : (isEn ? 'New preset' : 'Nouveau preset')}
        </h3>
        <Button variant="gold" size="sm" onClick={onSave} loading={isSaving} className="flex items-center gap-1.5 shrink-0">
          <Save size={13} /> {isEn ? 'Save' : 'Sauvegarder'}
        </Button>
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-3 bg-gray-800/60 rounded-xl px-4 py-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-semibold">{isEn ? 'Name' : 'Nom'}</label>
          <input
            value={draft.name}
            onChange={e => onNameChange(e.target.value)}
            className="bg-gray-900/80 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
            placeholder={isEn ? 'e.g. Cash Game GTO' : 'ex. Cash Game GTO'}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-semibold">{isEn ? 'Description (optional)' : 'Description (optionnel)'}</label>
          <input
            value={draft.description}
            onChange={e => onDescChange(e.target.value)}
            className="bg-gray-900/80 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold-500"
            placeholder={isEn ? 'Short description…' : 'Courte description…'}
          />
        </div>

        {/* Stack range toggle */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => onStackToggle(!draft.useStack)}
              className={`w-8 h-4 rounded-full transition-colors relative ${draft.useStack ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform shadow ${draft.useStack ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs text-gray-300">
              {isEn ? 'Stack range filter' : 'Filtre par stack'}
            </span>
          </label>
          {draft.useStack && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">{isEn ? 'From' : 'De'}</span>
              <input
                type="number" min={0} max={500} step={5}
                value={draft.stackMin}
                onChange={e => onStackMin(Number(e.target.value))}
                className="w-20 bg-gray-900/80 border border-gray-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-gray-400">bb {isEn ? 'to' : 'à'}</span>
              <input
                type="number" min={0} max={500} step={5}
                value={draft.stackMax}
                onChange={e => onStackMax(Number(e.target.value))}
                className="w-20 bg-gray-900/80 border border-gray-600 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-gray-400">bb</span>
            </div>
          )}
        </div>
      </div>

      {/* Position tabs (only if more than 1 position) */}
      {positions.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          {positions.map(pos => (
            <button
              key={pos}
              onClick={() => onTabChange(pos)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === pos
                  ? 'bg-gold-500 text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      )}

      {/* Range editor for current tab */}
      {draft.data[activeTab] && (
        <div className="bg-gray-800/60 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-300">
              {isEn ? `Edit range — ${activeTab}` : `Modifier la range — ${activeTab}`}
            </span>
          </div>
          <RangeEditor
            matrix={draft.data[activeTab]}
            onChange={m => onMatrixChange(activeTab, m)}
            position={activeTab}
            onReset={onResetTab}
          />
        </div>
      )}
    </div>
  );
}
