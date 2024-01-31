import { Buffer } from 'buffer';
import http from 'stream-http';

if (typeof window !== 'undefined') {
    window.http = http;
    window.Buffer ||= Buffer;
}
