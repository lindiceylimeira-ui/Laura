import React, { useState, useEffect } from 'react';
import { X, Save, UserCheck, Building, GraduationCap, CheckCircle } from 'lucide-react';
import { Configuracoes } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: Configuracoes | null;
  onSave: (newConfig: Configuracoes) => Promise<void>;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [formData, setFormData] = useState<Configuracoes>({
    aluno_responsavel: '',
    matricula_aluno: '',
    curso_instituicao: '',
    nome_almoxarifado: '',
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await onSave(formData);
      setSuccessMsg('Configurações salvas com sucesso!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="modal-configuracoes-responsavel"
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-heading">
                Identificação do Responsável Técnico
              </h2>
              <p className="text-xs text-slate-500">
                Dados exibidos em cabeçalhos, rodapés, relatórios e requisições
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Nome do Aluno Responsável Técnico *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.aluno_responsavel}
                onChange={(e) => setFormData({ ...formData, aluno_responsavel: e.target.value })}
                placeholder="Ex: Laura Lavínia"
                className="w-full pl-3 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Requisito 5: Este nome é impresso e assinado em todas as requisições e relatórios.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Matrícula / R.A. do Aluno
              </label>
              <input
                type="text"
                value={formData.matricula_aluno}
                onChange={(e) => setFormData({ ...formData, matricula_aluno: e.target.value })}
                placeholder="Ex: 2026.ENG.1048"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Curso / Instituição
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.curso_instituicao}
                  onChange={(e) => setFormData({ ...formData, curso_instituicao: e.target.value })}
                  placeholder="Ex: Engenharia / Gestão"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Nome da Unidade / Almoxarifado
            </label>
            <input
              type="text"
              value={formData.nome_almoxarifado}
              onChange={(e) => setFormData({ ...formData, nome_almoxarifado: e.target.value })}
              placeholder="Ex: Almoxarifado Central de Operações"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
