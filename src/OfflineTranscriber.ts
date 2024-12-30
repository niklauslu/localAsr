// src/OfflineTranscriber.ts

import WebSocket from 'ws';

interface ConfigParams {
  mode: 'offline';
  wav_name: string;
  wav_format: string;
  is_speaking: boolean;
  hotwords?: string;
  itn?: boolean;
  audio_fs?: number;
  svs_lang?: string;
  svs_itn?: boolean;
}

interface RecognitionResult {
  mode: 'offline';
  wav_name: string;
  text: string;
  is_final: boolean;
  timestamp?: number[][];
  stamp_sents?: StampSent[];
}

interface StampSent {
  text_seg: string;
  punc: string;
  start: number;
  end: number;
  ts_list: number[][];
}

type RecognitionCallback = (result: RecognitionResult) => void;

export class OfflineTranscriber {
  private ws: WebSocket;
  private config: ConfigParams;
  private onReady: () => void;
  private onResult: RecognitionCallback;

  constructor(
    serverUrl: string,
    config: Omit<ConfigParams, 'mode'>,
    callbacks: {
        onReady: () => void,
        onResult: RecognitionCallback
    }
  ) {
    this.config = { mode: 'offline', ...config };
    this.onResult = callbacks.onResult;
    this.onReady = callbacks.onReady;
    this.ws = new WebSocket(serverUrl);

    this.ws.on('open', this.onOpen.bind(this));
    this.ws.on('message', this.onMessage.bind(this));
    this.ws.on('error', this.onError.bind(this));
    this.ws.on('close', this.onClose.bind(this));
  }

  private onOpen() {
    // 发送首次通信的配置参数
    const initialMessage = JSON.stringify(this.config);
    this.ws.send(initialMessage);
    console.log('Connection opened and initial message sent.');
    this.onReady();
  }

  private onMessage(data: WebSocket.Data) {
    if (typeof data === 'string') {
      try {
        const result: RecognitionResult = JSON.parse(data);
        this.onResult(result);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    } else {
      console.warn('Received non-string data.');
    }
  }

  private onError(error: Error) {
    console.error('WebSocket error:', error);
  }

  private onClose(code: number, reason: Buffer) {
    console.log(`WebSocket closed. Code: ${code}, Reason: ${reason.toString()}`);
  }

  /**
   * 发送音频数据
   * @param audioBuffer 音频数据 Buffer
   */
  public sendAudioData(audioBuffer: Buffer) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(audioBuffer);
      console.log('Audio data sent.');
    } else {
      console.error('WebSocket is not open. Ready state:', this.ws.readyState);
    }
  }

  /**
   * 发送音频结束标志
   */
  public sendEnd() {
    const endMessage = JSON.stringify({ is_speaking: false });
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(endMessage);
      console.log('End message sent.');
    } else {
      console.error('WebSocket is not open. Ready state:', this.ws.readyState);
    }
  }

  /**
   * 关闭 WebSocket 连接
   */
  public close() {
    this.ws.close();
  }
}