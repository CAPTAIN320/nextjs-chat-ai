"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import UsernameForm from "@/components/username-form";
import Gamma from "@/lib/gamma";
import { getSelectedModel } from "@/lib/model-helper";
import { ChatRequestOptions } from "ai";
import { useChat } from "ai/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    setMessages,
  } = useChat();
  const [chatId, setChatId] = React.useState<string>("");
  const [selectedModel, setSelectedModel] = React.useState<string>(
    getSelectedModel()
  );
  const [open, setOpen] = React.useState(false);
  const [gamma, setGamma] = React.useState<Gamma | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !error && chatId && messages.length > 0) {
      if (typeof window !== "undefined") {
        // Save messages to local storage
        localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages));
      }
      // Trigger the storage event to update the sidebar component
      window.dispatchEvent(new Event("storage"));
    }
  }, [messages, chatId, isLoading, error]);

  useEffect(() => {
    console.log("selectedModel:", selectedModel);
    if (!localStorage.getItem("ollama_user")) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (selectedModel === "Browser Model") {
      console.log("Selected model: Browser");
      const gammaInstance = Gamma.getInstance();
      setGamma(gammaInstance);
    }
  }, [selectedModel]);

  const addMessage = (Message: any) => {
    console.log("addMessage:", Message);
    messages.push(Message);
    window.dispatchEvent(new Event("storage"));
    setMessages([...messages]);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (messages.length === 0) {
      // Generate a random id for the chat
      console.log("Generating chat id");
      const id = uuidv4();
      setChatId(id);
    }

    if (selectedModel === "Browser Model") {
      try {
        // Add the user message to the chat
        addMessage({ role: "user", content: input, id: chatId });

        if (gamma === null) {
          const gammaInstance = Gamma.getInstance();
          setGamma(gammaInstance);
        }

        // Generate a response using the Browser Model
        // console.log('Processing message with Browser Model:', input);
        const response = gamma ? await gamma.summarize(input) : ""; // TODO: needs to show in UI

        console.log("Response from Browser Model:", response);

        // setNewMessages({ role: "user", content: response, id: chatId });
        addMessage({ role: "assistant", content: response, id: chatId });
      } catch (error) {
        console.error("Error processing message with Browser Model:", error);
      }
    } else {
      setMessages([...messages]);

      // Prepare the options object with additional body data, to pass the model.
      const requestOptions: ChatRequestOptions = {
        options: {
          body: {
            selectedModel: selectedModel,
          },
        },
      };

      // Call the handleSubmit function with the options
      handleSubmit(e, requestOptions);
    }
  };

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
      <Dialog open={open} onOpenChange={setOpen}>
        <ChatLayout
          chatId={chatId}
          setSelectedModel={setSelectedModel}
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={onSubmit}
          isLoading={isLoading}
          error={error}
          stop={stop}
          navCollapsedSize={10}
          defaultLayout={[30, 160]}
        />
        <DialogContent className="flex flex-col space-y-4">
          <DialogHeader className="space-y-2">
            <DialogTitle>Welcome to Ollama!</DialogTitle>
            <DialogDescription>
              Enter your name to get started. This is just to personalize your
              experience.
            </DialogDescription>
            <UsernameForm setOpen={setOpen} />
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </main>
  );
}
