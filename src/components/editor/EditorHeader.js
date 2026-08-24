import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import {
  ChevronLeft,
  RotateCcw,
  RotateCw,
  Save,
  Download,
  Sliders,
  Wand2,
  Share2,
  FolderOpen,
  Upload,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const EditorHeader = ({
  title = 'Untitled Song',
  onBack,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onSave,
  onExport,
  onOpenLibrary,
  onImportAudio,
  editorMode = 'simple', // 'simple' | 'advanced'
  onToggleMode,
}) => {
  return (
    <View style={styles.headerContainer}>
      {/* Left: Back Button & Song Title */}
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.iconCircleBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft color="#FFF" size={22} />
        </TouchableOpacity>

        <View style={styles.titleBox}>
          <Text style={styles.projectTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: editorMode === 'simple' ? '#10B981' : '#A855F7' },
              ]}
            />
            <Text style={styles.statusText}>
              {editorMode === 'simple' ? 'Simple Timeline' : 'Advanced Pro DAW'}
            </Text>
          </View>
        </View>
      </View>

      {/* Center: Mode Switcher (Green -> Purple) */}
      <TouchableOpacity
        style={[
          styles.modeTogglePill,
          editorMode === 'simple' ? styles.modePillGreen : styles.modePillPurple,
        ]}
        onPress={onToggleMode}
        activeOpacity={0.8}
      >
        {editorMode === 'simple' ? (
          <>
            <Wand2 size={13} color="#10B981" />
            <Text style={[styles.modePillText, { color: '#10B981' }]}>Simple</Text>
          </>
        ) : (
          <>
            <Sliders size={13} color="#C084FC" />
            <Text style={[styles.modePillText, { color: '#C084FC' }]}>Advanced</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Right: Library, Import, History, Save & Export */}
      <View style={styles.rightSection}>
        {onOpenLibrary && (
          <TouchableOpacity style={styles.iconActionBtn} onPress={onOpenLibrary} activeOpacity={0.7}>
            <FolderOpen color="#00E5FF" size={16} />
          </TouchableOpacity>
        )}

        {onImportAudio && (
          <TouchableOpacity style={styles.iconActionBtn} onPress={onImportAudio} activeOpacity={0.7}>
            <Upload color="#FFF" size={16} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.historyBtn, !canUndo && styles.btnDisabled]}
          onPress={onUndo}
          disabled={!canUndo}
          activeOpacity={0.7}
        >
          <RotateCcw color={canUndo ? '#FFF' : 'rgba(255,255,255,0.25)'} size={17} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.historyBtn, !canRedo && styles.btnDisabled]}
          onPress={onRedo}
          disabled={!canRedo}
          activeOpacity={0.7}
        >
          <RotateCw color={canRedo ? '#FFF' : 'rgba(255,255,255,0.25)'} size={17} />
        </TouchableOpacity>

        {onSave && (
          <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.7}>
            <Save color="#94A3B8" size={17} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.exportBtn} onPress={onExport} activeOpacity={0.85}>
          <LinearGradient
            colors={editorMode === 'simple' ? ['#10B981', '#059669'] : ['#A855F7', '#6D28D9']}
            style={styles.exportGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Download color="#FFF" size={15} />
            <Text style={styles.exportBtnText}>Export</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0A0A10',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBox: {
    flex: 1,
    paddingRight: 8,
  },
  projectTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  modeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginHorizontal: 8,
  },
  modePillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
  },
  modePillPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#A855F7',
  },
  modePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  exportBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  exportGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 6,
  },
  exportBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
export default EditorHeader;
