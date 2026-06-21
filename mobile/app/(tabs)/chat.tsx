import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { Input, Spinner, Text } from 'heroui-native';
import { useThemeColor } from 'heroui-native';
import { Send, Volume2 } from 'lucide-react-native';

import { Markdown } from '@/components/Markdown';
import { fetchVoiceBriefing } from '@/lib/api';
import { useChatStore } from '@/lib/chatStore';
import { useActiveContext } from '@/lib/useActiveContext';
import type { ChatMessage } from '@/lib/types';

const QUICK_PROMPTS = [
  { label: 'Current AQI', prompt: "What's the current air quality from my sensor?" },
  { label: 'Compare sources', prompt: 'Compare my sensor reading with Google air quality.' },
  { label: 'Health advice', prompt: 'What health precautions should I take right now?' },
  { label: 'Weather impact', prompt: 'How is the weather affecting air quality today?' },
];

export default function ChatScreen() {
  const { messages, streaming, send } = useChatStore();
  const ctx = useActiveContext();
  const [input, setInput] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceText, setVoiceText] = useState<string | null>(null);
  const [foreground, accent] = useThemeColor(['foreground', 'accent']);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const onSend = (text: string) => {
    void send(text);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const playBriefing = async () => {
    setVoiceLoading(true);
    setVoiceText(null);
    try {
      const briefing = await fetchVoiceBriefing(ctx.device?.deviceId, ctx.lat, ctx.lng);
      setVoiceText(briefing.text);
      if (briefing.audio) {
        try {
          const { createAudioPlayer } = await import('expo-audio');
          const player = createAudioPlayer({ uri: `data:audio/mp3;base64,${briefing.audio}` });
          player.play();
        } catch {
          // audio playback unavailable on this platform; text is still shown
        }
      }
    } catch {
      setVoiceText('Voice briefing is unavailable right now.');
    } finally {
      setVoiceLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {messages.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-foreground text-center text-lg font-semibold">
            Ask the Bair1 assistant
          </Text>
          <Text className="text-muted mt-2 text-center text-sm">
            Get live air-quality insights, compare data sources, and health advice for your sensor.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <Bubble message={item} fg={foreground} accent={accent} />}
        />
      )}

      {/* Voice briefing + quick prompts */}
      <View className="gap-2 px-4 pb-2">
        {voiceText ? (
          <View className="bg-surface border-border rounded-xl border p-3">
            <Text className="text-muted text-xs">Voice briefing</Text>
            <Text className="text-foreground mt-1 text-sm">{voiceText}</Text>
          </View>
        ) : null}
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => void playBriefing()}
            disabled={voiceLoading}
            className="bg-accent flex-row items-center gap-1.5 rounded-full px-3 py-2"
          >
            {voiceLoading ? (
              <Spinner size="sm" color="#191C18" />
            ) : (
              <Volume2 size={14} color="#191C18" />
            )}
            <Text className="text-xs font-semibold text-[#191C18]">Voice briefing</Text>
          </Pressable>
          {QUICK_PROMPTS.map((q) => (
            <Pressable
              key={q.label}
              onPress={() => onSend(q.prompt)}
              disabled={streaming}
              className="bg-surface border-border rounded-full border px-3 py-2"
            >
              <Text className="text-foreground text-xs">{q.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Composer */}
      <View className="border-border flex-row items-center gap-2 border-t px-4 py-3">
        <View className="flex-1">
          <Input
            placeholder="Ask about your air…"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => onSend(input)}
            returnKeyType="send"
            editable={!streaming}
          />
        </View>
        <Pressable
          onPress={() => onSend(input)}
          disabled={streaming || !input.trim()}
          className="bg-accent h-11 w-11 items-center justify-center rounded-full disabled:opacity-50"
        >
          {streaming ? <Spinner size="sm" color="#191C18" /> : <Send size={18} color="#191C18" />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message, fg, accent }: { message: ChatMessage; fg: string; accent: string }) {
  const isUser = message.role === 'user';
  return (
    <View className={`max-w-[85%] ${isUser ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-3.5 py-2.5 ${isUser ? '' : 'bg-surface border-border border'}`}
        style={isUser ? { backgroundColor: accent } : undefined}
      >
        {message.content === '' ? (
          <Spinner size="sm" />
        ) : (
          <Markdown content={message.content} color={isUser ? '#191C18' : fg} />
        )}
      </View>
    </View>
  );
}
