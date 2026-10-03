'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  createChannel,
  createChannelSection,
  getEncodingQuality,
  listChannelSections,
  listEncodingSourceOptions,
  listHdmiDevices,
  updateChannel,
} from '@/features/live/api';
import type {
  Channel,
  ChannelInput,
  ChannelSection,
  ChannelType,
  EncodingSourceMode,
  EncodingSourceOptionsResponse,
  HdmiCaptureDevice,
} from '@/features/live/types';
import { notifyMutation, useToast } from '@/shared/ui';

export type ChannelModalState = Channel | 'new' | null;

type QualityOption = { id: string; label: string };

export function useChannelModal(
  state: ChannelModalState,
  onClose: () => void,
  onSaved: () => Promise<void>,
) {
  const toast = useToast();
  const initial = state && state !== 'new' ? state : null;

  const [sections, setSections] = useState<ChannelSection[]>([]);
  const [sectionId, setSectionId] = useState(initial?.sectionId ?? '');
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [sectionBusy, setSectionBusy] = useState(false);

  const [label, setLabel] = useState(initial?.label ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<ChannelType>(initial?.type ?? 'IPTV');
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl ?? '');
  const [videoDevice, setVideoDevice] = useState(initial?.videoDevice ?? '');
  const [audioDevice, setAudioDevice] = useState(initial?.audioDevice ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [alwaysOn, setAlwaysOn] = useState(initial?.alwaysOn ?? false);
  const [sourceMode, setSourceMode] = useState<EncodingSourceMode>(
    initial?.sourceMode ?? 'passthrough',
  );
  const [sourceOptions, setSourceOptions] = useState<
    EncodingSourceOptionsResponse['options']
  >([]);
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([]);
  const [qualityRungIds, setQualityRungIds] = useState<string[]>(
    initial?.qualityRungIds ?? [],
  );
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [devices, setDevices] = useState<HdmiCaptureDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reloadSections() {
    setSections(await listChannelSections());
  }

  useEffect(() => {
    if (!state) return;
    reloadSections().catch(() => setSections([]));
    listEncodingSourceOptions()
      .then((res) => {
        setSourceOptions(res.options);
        if (state === 'new') {
          setSourceMode(res.defaultMode);
        }
      })
      .catch(() => setSourceOptions([]));
    getEncodingQuality()
      .then((quality) => {
        const enabled = quality.rungs.filter((rung) => rung.enabled);
        setQualityOptions(
          enabled.map((rung) => ({ id: rung.id, label: rung.label })),
        );
        if (state === 'new') {
          setQualityRungIds(enabled.map((rung) => rung.id));
        } else if (!state.qualityRungIds?.length) {
          setQualityRungIds(enabled.map((rung) => rung.id));
        }
      })
      .catch(() => setQualityOptions([]));

    if (state === 'new') {
      setSectionId('');
      setAddingSection(false);
      setNewSectionLabel('');
      setNewSectionName('');
      setLabel('');
      setName('');
      setType('IPTV');
      setSourceUrl('');
      setVideoDevice('');
      setAudioDevice('');
      setImageUrl('');
      setAlwaysOn(false);
      setSourceMode('passthrough');
      setQualityRungIds([]);
      setSortOrder(0);
      setSelectedDeviceId('');
      setError(null);
      return;
    }
    setSectionId(state.sectionId);
    setAddingSection(false);
    setNewSectionLabel('');
    setNewSectionName('');
    setLabel(state.label);
    setName(state.name);
    setType(state.type);
    setSourceUrl(state.sourceUrl ?? '');
    setVideoDevice(state.videoDevice ?? '');
    setAudioDevice(state.audioDevice ?? '');
    setImageUrl(state.imageUrl ?? '');
    setAlwaysOn(state.alwaysOn);
    setSourceMode(state.sourceMode ?? 'passthrough');
    setQualityRungIds(state.qualityRungIds ?? []);
    setSortOrder(state.sortOrder);
    setSelectedDeviceId(state.videoDevice ?? '');
    setError(null);
  }, [state]);

  function selectHdmiDevice(
    deviceId: string,
    fromList: HdmiCaptureDevice[] = devices,
  ) {
    setSelectedDeviceId(deviceId);
    const device = fromList.find((d) => d.id === deviceId);
    if (!device) return;
    setVideoDevice(device.videoPath);
    setAudioDevice(device.audioPath ?? device.audioPaths[0] ?? '');
  }

  async function discoverHdmiDevices(preferredVideo?: string) {
    setDevicesLoading(true);
    try {
      const exceptId =
        state && state !== 'new' ? state.id : undefined;
      const list = await listHdmiDevices(exceptId);
      setDevices(list);
      const prefer = preferredVideo ?? videoDevice;
      const match = prefer
        ? list.find((d) => d.videoPath === prefer)
        : undefined;
      if (match) {
        selectHdmiDevice(match.id, list);
      } else if (prefer) {
        setSelectedDeviceId('__saved__');
      } else if (list.length === 1) {
        selectHdmiDevice(list[0].id, list);
      } else {
        setSelectedDeviceId('');
        setVideoDevice('');
        setAudioDevice('');
      }
    } catch {
      setDevices([]);
      setSelectedDeviceId('');
    } finally {
      setDevicesLoading(false);
    }
  }

  useEffect(() => {
    if (!state || type !== 'HDMI') return;
    void discoverHdmiDevices(
      state !== 'new' ? (state.videoDevice ?? undefined) : undefined,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- اكتشاف عند فتح/تغيير النوع فقط
  }, [state, type]);

  async function saveSection() {
    const nextLabel = newSectionLabel.trim();
    const nextName = newSectionName.trim();
    if (!nextLabel || !nextName) return;
    setSectionBusy(true);
    setError(null);
    try {
      const created = await notifyMutation(
        toast,
        () =>
          createChannelSection({
            label: nextLabel,
            name: nextName,
          }),
        { success: 'تم إضافة القسم بنجاح' },
      );
      await reloadSections();
      setSectionId(created.id);
      setAddingSection(false);
      setNewSectionLabel('');
      setNewSectionName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ القسم');
    } finally {
      setSectionBusy(false);
    }
  }

  function changeType(next: ChannelType) {
    setType(next);
    if (next !== 'HDMI') {
      setDevices([]);
      setSelectedDeviceId('');
      setVideoDevice('');
      setAudioDevice('');
    }
  }

  function changeSourceMode(next: EncodingSourceMode) {
    setSourceMode(next);
    if (next === 'encode_gpu' && !qualityRungIds.length && qualityOptions.length) {
      setQualityRungIds(qualityOptions.map((item) => item.id));
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!sectionId) {
      setError('اختر قسماً أو أضف قسماً جديداً');
      return;
    }
    if (type === 'HDMI' && (!videoDevice.trim() || !audioDevice.trim())) {
      setError('اختر جهاز HDMI Capture من قائمة المصدر');
      return;
    }
    if (sourceMode === 'encode_gpu' && !qualityRungIds.length) {
      setError('اختر جودة واحدة على الأقل لترميز GPU');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const input: ChannelInput = {
        sectionId,
        name: name.trim(),
        label: label.trim(),
        type,
        sourceUrl: type === 'IPTV' ? sourceUrl.trim() : null,
        videoDevice: type === 'HDMI' ? videoDevice.trim() : null,
        audioDevice: type === 'HDMI' ? audioDevice.trim() : null,
        imageUrl: imageUrl.trim() || null,
        alwaysOn,
        sourceMode,
        qualityRungIds:
          sourceMode === 'encode_gpu' ? qualityRungIds : undefined,
        sortOrder,
      };
      await notifyMutation(
        toast,
        async () => {
          if (state === 'new') await createChannel(input);
          else if (state) await updateChannel(state.id, input);
        },
        {
          success:
            state === 'new' ? 'تم إضافة القناة بنجاح' : 'تم تعديل القناة بنجاح',
        },
      );
      onClose();
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setBusy(false);
    }
  }

  return {
    sections,
    sectionId,
    setSectionId,
    addingSection,
    setAddingSection,
    newSectionLabel,
    setNewSectionLabel,
    newSectionName,
    setNewSectionName,
    sectionBusy,
    label,
    setLabel,
    name,
    setName,
    type,
    changeType,
    sourceUrl,
    setSourceUrl,
    videoDevice,
    audioDevice,
    setAudioDevice,
    imageUrl,
    setImageUrl,
    alwaysOn,
    setAlwaysOn,
    sourceMode,
    changeSourceMode,
    sourceOptions,
    qualityOptions,
    qualityRungIds,
    setQualityRungIds,
    sortOrder,
    setSortOrder,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    devicesLoading,
    busy,
    error,
    selectHdmiDevice,
    discoverHdmiDevices,
    saveSection,
    submit,
  };
}
