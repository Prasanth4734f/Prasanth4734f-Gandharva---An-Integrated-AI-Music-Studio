import CONFIG from '../config/api.config';

export const uploadVocalAndMix = async (fileUri, fileName, onProgress) => {
  const formData = new FormData();
  formData.append('vocalFile', {
    uri: fileUri,
    name: fileName || 'vocal_recording.m4a',
    type: 'audio/m4a',
  });

  // Since React Native fetch doesn't easily support upload progress without XMLHttpRequest,
  // we simulate the pipeline steps in the UI by passing callbacks.
  if(onProgress) onProgress('analyzing');
  await new Promise(r => setTimeout(r, 2000));
  
  if(onProgress) onProgress('generating');
  await new Promise(r => setTimeout(r, 3000));
  
  if(onProgress) onProgress('mixing');

  const response = await fetch(`${CONFIG.API_URL}/vocal-mix`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to process vocal track.');
  }

  const data = await response.json();
  if(onProgress) onProgress('done');
  return data;
};
