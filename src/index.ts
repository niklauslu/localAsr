// src/index.ts

import fs from 'fs';
import path from 'path';
import { OfflineTranscriber } from './OfflineTranscriber';

// 服务端 WebSocket URL
const SERVER_URL = 'ws://localhost:10095';

// 配置参数
const config = {
    wav_name: 'example.wav',
    wav_format: 'pcm',
    is_speaking: true,
    hotwords: '{"阿里巴巴":20,"通义实验室":30}',
    itn: true,
    audio_fs: 16000, // 例如，16kHz
    svs_lang: 'auto',
    svs_itn: true,
};

// 识别结果回调
const handleRecognitionResult = (result: any) => {
    console.log('Recognition Result:', result);
};

// 创建转写实例
const transcriber = new OfflineTranscriber(SERVER_URL, config, {
    onReady: () => {
        // 读取音频文件并发送
        const audioFilePath = path.resolve(__dirname, '../public/chat.wav');
        const readStream = fs.createReadStream(audioFilePath);

        let index = 0
        readStream.on('data', (chunk: Buffer) => {
            console.log('Sending audio data...');
            index++;
            setTimeout(() => {
                transcriber.sendAudioData(chunk);
            }, 100 * index);
            
        });

        readStream.on('end', () => {
            // 发送结束标志
            console.log('Audio data sent. Sending end signal...');
            index++
            setTimeout(() => {
                transcriber.sendEnd();
            }, 100 * index)
            
        });

        // 处理进程退出，关闭 WebSocket 连接
        process.on('SIGINT', () => {
            console.log('Process interrupted. Closing connection.');
            transcriber.close();
            process.exit();
        });
    },
    onResult: handleRecognitionResult,
});

