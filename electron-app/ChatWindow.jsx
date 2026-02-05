import React, { useState } from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  HStack,
  Input,
  Button,
  Badge,
  IconButton,
  extendTheme
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';

// Statsig-inspired professional theme
const theme = extendTheme({
  colors: {
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
  },
  fonts: {
    heading: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Input: {
      defaultProps: {
        focusBorderColor: 'gray.500',
      },
      baseStyle: {
        field: {
          borderRadius: '4px',
          fontWeight: '400',
          fontSize: '14px',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          letterSpacing: '-0.01em',
        },
      },
    },
  },
});

function ChatWindow() {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const handleClose = () => {
    if (window.electronAPI?.closeChatWindow) {
      window.electronAPI.closeChatWindow();
    }
  };

  const handleSend = () => {
    if (chatInput.trim()) {
      const newMessage = { role: 'user', content: chatInput };
      setChatMessages([...chatMessages, newMessage]);
      setChatInput('');
      // TODO: Send to AI and get response
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Box
        w="100%"
        h="100vh"
        bg="#fafbfb"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* Chat Header */}
        <Box
          px={4}
          py={3}
          borderBottom="1px solid"
          borderColor="#d8d9da"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          bg="#ffffff"
          flexShrink={0}
        >
          <HStack spacing={2}>
            <Text fontSize="md" color="gray.700" fontWeight="600">
              Zeno AI Assistant
            </Text>
            {chatMessages.length > 0 && (
              <Badge
                bg="#e8e9ea"
                color="gray.600"
                px={2}
                py={0.5}
                borderRadius="3px"
                fontSize="xs"
                fontWeight="600"
              >
                {chatMessages.length}
              </Badge>
            )}
          </HStack>
          <IconButton
            icon={<CloseIcon />}
            onClick={handleClose}
            variant="ghost"
            size="sm"
            aria-label="Close chat"
            color="gray.500"
            _hover={{ bg: '#e8e9ea', color: 'gray.700' }}
          />
        </Box>

        {/* Chat Messages */}
        <Box
          flex={1}
          overflowY="auto"
          p={6}
          display="flex"
          flexDirection="column"
          gap={4}
        >
          {chatMessages.length === 0 ? (
            <Box textAlign="center" py={16}>
              <Text color="gray.500" fontSize="md" fontWeight="500" mb={2}>
                Ask for changes to your application
              </Text>
              <Text color="gray.400" fontSize="sm">
                Type a message below to get started
              </Text>
            </Box>
          ) : (
            chatMessages.map((msg, idx) => (
              <Box
                key={idx}
                alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                maxW="85%"
              >
                <Box
                  bg={msg.role === 'user' ? 'gray.600' : '#e8e9ea'}
                  color={msg.role === 'user' ? 'white' : 'gray.700'}
                  px={4}
                  py={3}
                  borderRadius="6px"
                  fontSize="sm"
                  lineHeight="1.6"
                >
                  <Text>{msg.content}</Text>
                </Box>
              </Box>
            ))
          )}
        </Box>

        {/* Chat Input */}
        <Box
          px={4}
          py={4}
          borderTop="1px solid"
          borderColor="#d8d9da"
          bg="#ffffff"
          flexShrink={0}
        >
          <HStack spacing={3}>
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask for changes..."
              bg="#ffffff"
              borderColor="#c9cacb"
              borderWidth="1px"
              size="md"
              fontSize="14px"
              fontWeight="400"
              letterSpacing="-0.01em"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && chatInput.trim()) {
                  handleSend();
                }
              }}
              _hover={{ borderColor: '#a8a9aa', bg: '#fafbfb' }}
              _focus={{ borderColor: 'gray.500', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.08)', bg: '#ffffff' }}
              _placeholder={{ color: 'gray.400', fontWeight: '400', opacity: 1 }}
            />
            <Button
              size="md"
              bg="gray.600"
              color="white"
              onClick={handleSend}
              isDisabled={!chatInput.trim()}
              _hover={{ bg: 'gray.700' }}
              fontWeight="600"
              px={6}
            >
              Send
            </Button>
          </HStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default ChatWindow;
