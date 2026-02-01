import React, { useState, useEffect, useRef } from 'react';
import {
  ChakraProvider,
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  ButtonGroup,
  VStack,
  HStack,
  Grid,
  GridItem,
  Code,
  useToast,
  Badge,
  IconButton,
  Flex,
  Spacer,
  Divider,
  extendTheme
} from '@chakra-ui/react';
import { ChevronRightIcon, CloseIcon, DeleteIcon, RepeatIcon, ExternalLinkIcon, ChatIcon, ChevronLeftIcon } from '@chakra-ui/icons';

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
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      baseStyle: {
        fontWeight: '600',
        borderRadius: '4px',
      },
    },
    Input: {
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
    Select: {
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

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [detectedUrls, setDetectedUrls] = useState({ ui: null, api: null });
  const [selectedUrl, setSelectedUrl] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [formData, setFormData] = useState({
    repo: '',
    ref: 'main',
    workflow: 'run',
    service: 'all',
    publishUI: '',
    publishAPI: '',
    entry: '',
    dir: '',
    timeout: '10m'
  });

  const browserViewRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    // Set up output listener
    window.electronAPI?.onZenoOutput((data) => {
      const text = data.data;
      setOutput(prev => prev + text);
      parseUrlsFromOutput(text);
    });

    return () => {
      window.electronAPI?.removeZenoOutputListener();
    };
  }, []);


  const parseUrlsFromOutput = (text) => {
    const uiMatch = text.match(/\[info\]\s+UI:\s+(http:\/\/localhost:\d+)/i);
    const apiMatch = text.match(/\[info\]\s+API:\s+(http:\/\/localhost:\d+)/i);
    
    if (uiMatch) {
      setDetectedUrls(prev => ({ ...prev, ui: uiMatch[1] }));
    }
    
    if (apiMatch) {
      setDetectedUrls(prev => ({ ...prev, api: apiMatch[1] }));
    }
  };

  const handleInputChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    
    // Auto-generate directory from repo URL whenever repo changes
    if (field === 'repo' && value) {
      // Extract repo name from various URL formats:
      // https://github.com/user/repo -> repo
      // https://github.com/user/repo.git -> repo
      // user/repo -> repo
      // git@github.com:user/repo.git -> repo
      let repoName = value.trim();
      
      // Remove .git suffix if present
      repoName = repoName.replace(/\.git$/, '');
      
      // Extract the last part after the last slash
      const parts = repoName.split('/');
      repoName = parts[parts.length - 1];
      
      // Remove any query params or fragments
      repoName = repoName.split('?')[0].split('#')[0];
      
      if (repoName) {
        updatedData.dir = `repos/${repoName}`;
      } else {
        updatedData.dir = '';
      }
    }
    
    setFormData(updatedData);
  };

  const handleToggleChat = () => {
    setChatOpen(!chatOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRunning) return;

    setOutput('');
    setDetectedUrls({ ui: null, api: null });
    setIsRunning(true);

    try {
      const result = await window.electronAPI.runZeno(formData);
      
      if (result.exitCode === 0) {
        toast({
          title: 'Success',
          description: 'Process completed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: `Process failed with exit code ${result.exitCode}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = async () => {
    try {
      await window.electronAPI.stopZeno();
      toast({
        title: 'Stopped',
        description: 'Process stopped by user',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    setOutput('');
  };

  const handleUrlSelect = (url) => {
    setSelectedUrl(url);
    // webview src will update automatically via the src prop
  };

  const handleRefresh = () => {
    if (browserViewRef.current && selectedUrl) {
      try {
        browserViewRef.current.reload();
      } catch (e) {
        // Fallback: reload by setting src again
        const currentSrc = browserViewRef.current.src;
        browserViewRef.current.src = 'about:blank';
        setTimeout(() => {
          if (browserViewRef.current) {
            browserViewRef.current.src = currentSrc;
          }
        }, 100);
      }
    }
  };

  const handleOpenExternal = async () => {
    if (selectedUrl) {
      await window.electronAPI.openExternal(selectedUrl);
    }
  };

  useEffect(() => {
    // Auto-select UI when detected
    if (detectedUrls.ui && !selectedUrl) {
      setSelectedUrl(detectedUrls.ui);
    }
  }, [detectedUrls.ui, selectedUrl]);

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg="#f9fafb" color="gray.800" position="relative" overflow="hidden">
        {/* Header - Dark header */}
        <Box
          bg="#1f2937"
          borderBottom="1px solid"
          borderColor="#374151"
          py={4}
          px={8}
        >
          <Container maxW="container.xl">
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={3}>
                <Box
                  w={9}
                  h={9}
                  bg="#4b5563"
                  borderRadius="3px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="lg"
                  fontWeight="700"
                  color="white"
                >
                  Z
                </Box>
                <Box>
                  <Heading size="md" color="#f3f4f6" fontWeight="700" letterSpacing="-0.2px">
                    Zeno
                  </Heading>
                </Box>
              </Flex>
              <Text color="#9ca3af" fontSize="sm" fontWeight="500">
                Docker Runner
              </Text>
            </Flex>
          </Container>
        </Box>

        {/* Tabs - Dark tabs bar */}
        <Tabs index={activeTab} onChange={setActiveTab} colorScheme="gray" isLazy>
          <Box bg="#374151" borderBottom="1px solid" borderColor="#4b5563">
            <Container maxW="container.xl" px={8}>
              <TabList borderBottom="none" gap={1}>
                <Tab
                  fontWeight="500"
                  color="#d1d5db"
                  fontSize="sm"
                  px={4}
                  py={3}
                  mb="-1px"
                  borderBottom="2px solid transparent"
                  _selected={{ 
                    color: '#f9fafb', 
                    borderBottomColor: '#60a5fa',
                    fontWeight: '600'
                  }}
                  _hover={{ color: '#e5e7eb' }}
                >
                  Control Panel
                </Tab>
                <Tab
                  fontWeight="500"
                  color="#d1d5db"
                  fontSize="sm"
                  px={4}
                  py={3}
                  mb="-1px"
                  borderBottom="2px solid transparent"
                  _selected={{ 
                    color: '#f9fafb', 
                    borderBottomColor: '#60a5fa',
                    fontWeight: '600'
                  }}
                  _hover={{ color: '#e5e7eb' }}
                >
                  Browser
                </Tab>
              </TabList>
            </Container>
          </Box>

          <TabPanels>
            {/* Control Panel Tab */}
            <TabPanel p={0}>
              <Container maxW="container.xl" py={8} px={8}>
                {/* Card design with varied grays */}
                <Box 
                  bg="#ffffff" 
                  borderRadius="4px" 
                  p={8} 
                  mb={6} 
                  border="1px solid" 
                  borderColor="#e5e7eb"
                  boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1)"
                >
                  <Heading size="md" mb={1} color="#111827" fontWeight="700" letterSpacing="-0.1px">
                    Configuration
                  </Heading>
                  <Text color="#6b7280" mb={6} fontSize="sm" fontWeight="500">
                    Configure your Docker workflow settings
                  </Text>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={6} align="stretch">
                      <FormControl isRequired>
                        <FormLabel fontWeight="600" color="#374151" mb={2} fontSize="sm">
                          Repository URL
                        </FormLabel>
                        <Input
                          value={formData.repo}
                          onChange={(e) => handleInputChange('repo', e.target.value)}
                          placeholder="https://github.com/user/repo"
                          bg="#ffffff"
                          borderColor="#d1d5db"
                          borderWidth="1px"
                          size="md"
                          color="#111827"
                          fontSize="14px"
                          fontWeight="400"
                          letterSpacing="-0.01em"
                          _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                          _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                          _placeholder={{ color: '#9ca3af', fontWeight: '400', opacity: 1 }}
                        />
                      </FormControl>

                      <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                        <GridItem>
                          <FormControl>
                            <FormLabel fontWeight="600" color="#374151" mb={2} fontSize="sm">
                              Git Ref
                            </FormLabel>
                            <Input
                              value={formData.ref}
                              onChange={(e) => handleInputChange('ref', e.target.value)}
                              placeholder="main"
                              bg="#ffffff"
                              borderColor="#d1d5db"
                              borderWidth="1px"
                              size="md"
                              color="#111827"
                              fontSize="14px"
                              fontWeight="400"
                              letterSpacing="-0.01em"
                              _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                              _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                              _placeholder={{ color: '#9ca3af', fontWeight: '400', opacity: 1 }}
                            />
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl isRequired>
                            <FormLabel fontWeight="600" color="#374151" mb={2} fontSize="sm">
                              Workflow
                            </FormLabel>
                            <Select
                              value={formData.workflow}
                              onChange={(e) => handleInputChange('workflow', e.target.value)}
                              bg="#ffffff"
                              borderColor="#d1d5db"
                              borderWidth="1px"
                              size="md"
                              color="#111827"
                              fontSize="14px"
                              fontWeight="400"
                              letterSpacing="-0.01em"
                              _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                              _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                              _placeholder={{ color: '#9ca3af', fontWeight: '400', opacity: 1 }}
                            >
                              <option value="run">Run</option>
                              <option value="test">Test</option>
                              <option value="lint">Lint</option>
                              <option value="build">Build</option>
                            </Select>
                          </FormControl>
                        </GridItem>

                        <GridItem>
                          <FormControl>
                            <FormLabel fontWeight="600" color="#374151" mb={2} fontSize="sm">
                              Service
                            </FormLabel>
                            <Select
                              value={formData.service}
                              onChange={(e) => handleInputChange('service', e.target.value)}
                              bg="#ffffff"
                              borderColor="#d1d5db"
                              borderWidth="1px"
                              size="md"
                              color="#111827"
                              fontSize="14px"
                              fontWeight="400"
                              letterSpacing="-0.01em"
                              _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                              _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                              _placeholder={{ color: '#9ca3af', fontWeight: '400', opacity: 1 }}
                            >
                              <option value="all">All</option>
                              <option value="ui">UI</option>
                              <option value="api">API</option>
                            </Select>
                          </FormControl>
                        </GridItem>
                      </Grid>

                      <Box mt={8} pt={6} borderTop="1px solid" borderColor="#e5e7eb">
                        <ButtonGroup spacing={3}>
                          <Button
                            type="submit"
                            bg="#4b5563"
                            color="white"
                            size="md"
                            leftIcon={<ChevronRightIcon />}
                            isLoading={isRunning}
                            loadingText="Running..."
                            fontWeight="600"
                            px={6}
                            _hover={{ bg: '#374151' }}
                            _active={{ bg: '#1f2937' }}
                          >
                            Run Workflow
                          </Button>
                          <Button
                            type="button"
                            colorScheme="red"
                            size="md"
                            leftIcon={<CloseIcon />}
                            onClick={handleStop}
                            isDisabled={!isRunning}
                            fontWeight="600"
                            px={6}
                          >
                            Stop
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            leftIcon={<DeleteIcon />}
                            onClick={handleClear}
                            fontWeight="600"
                            color="gray.500"
                            _hover={{ bg: '#e8e9ea', color: 'gray.700' }}
                          >
                            Clear
                          </Button>
                        </ButtonGroup>
                      </Box>
                    </VStack>
                  </form>
                </Box>

                {/* Output Section - Statsig-inspired */}
                <Box 
                  bg="#fafbfb" 
                  borderRadius="4px" 
                  p={8} 
                  border="1px solid" 
                  borderColor="#d8d9da"
                  boxShadow="0 1px 2px 0 rgba(0, 0, 0, 0.03)"
                  h="500px" 
                  display="flex" 
                  flexDirection="column"
                >
                  <Flex align="center" justify="space-between" mb={4}>
                    <Heading size="md" color="#111827" fontWeight="700" letterSpacing="-0.1px">
                      Output
                    </Heading>
                    {output && (
                      <Badge 
                        bg="#f3f4f6" 
                        color="#4b5563" 
                        px={2.5} 
                        py={1} 
                        borderRadius="3px" 
                        fontSize="xs"
                        fontWeight="600"
                      >
                        {output.split('\n').filter(l => l.trim()).length} lines
                      </Badge>
                    )}
                  </Flex>
                  <Box
                    flex={1}
                    bg="#1a1d23"
                    borderRadius="3px"
                    p={5}
                    overflowY="auto"
                    fontFamily="ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace"
                    fontSize="13px"
                    border="1px solid"
                    borderColor="#2a2d33"
                    lineHeight="1.6"
                    fontWeight="400"
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#e5e7eb' }}>
                      {output || <Text color="#9ca3af">No output yet. Run a workflow to see logs here.</Text>}
                    </pre>
                  </Box>
                </Box>
              </Container>
            </TabPanel>

            {/* Browser Tab - Full screen with compact navbar */}
            <TabPanel p={0}>
              <Box h="calc(100vh - 140px)" display="flex" flexDirection="column" bg="#f0f1f2">
                {/* Compact Navbar - Dark */}
                <Box 
                  bg="#374151" 
                  px={6} 
                  py={3} 
                  borderBottom="1px solid" 
                  borderColor="#4b5563"
                  display="flex"
                  alignItems="center"
                  gap={4}
                  flexShrink={0}
                >
                  <FormControl maxW="180px">
                    <Select
                      placeholder="Select service..."
                      value={selectedUrl}
                      onChange={(e) => handleUrlSelect(e.target.value)}
                      bg="#1f2937"
                      borderColor="#4b5563"
                      borderWidth="1px"
                      size="sm"
                      color="#f3f4f6"
                      fontSize="sm"
                      _hover={{ borderColor: '#6b7280', bg: '#374151' }}
                      _focus={{ borderColor: '#60a5fa', boxShadow: '0 0 0 3px rgba(96, 165, 250, 0.2)', bg: '#1f2937' }}
                    >
                      {detectedUrls.ui && (
                        <option value={detectedUrls.ui}>UI</option>
                      )}
                      {detectedUrls.api && (
                        <option value={detectedUrls.api}>API</option>
                      )}
                    </Select>
                  </FormControl>

                  <Box flex={1} minW={0}>
                    <Code
                      bg="#1f2937"
                      color="#d1d5db"
                      px={3}
                      py={1.5}
                      borderRadius="3px"
                      fontSize="xs"
                      fontFamily="ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
                      border="1px solid"
                      borderColor="#4b5563"
                      display="block"
                      w="100%"
                      fontWeight="400"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {selectedUrl || 'No URL selected'}
                    </Code>
                  </Box>

                  <HStack spacing={1}>
                    {detectedUrls.ui && (
                      <Badge 
                        bg={selectedUrl === detectedUrls.ui ? '#60a5fa' : '#4b5563'}
                        color={selectedUrl === detectedUrls.ui ? 'white' : '#d1d5db'}
                        px={2}
                        py={0.5}
                        borderRadius="3px"
                        fontSize="xs"
                        fontWeight="600"
                        cursor="pointer"
                        onClick={() => handleUrlSelect(detectedUrls.ui)}
                      >
                        UI
                      </Badge>
                    )}
                    {detectedUrls.api && (
                      <Badge 
                        bg={selectedUrl === detectedUrls.api ? '#60a5fa' : '#4b5563'}
                        color={selectedUrl === detectedUrls.api ? 'white' : '#d1d5db'}
                        px={2}
                        py={0.5}
                        borderRadius="3px"
                        fontSize="xs"
                        fontWeight="600"
                        cursor="pointer"
                        onClick={() => handleUrlSelect(detectedUrls.api)}
                      >
                        API
                      </Badge>
                    )}
                  </HStack>

                  <HStack spacing={1}>
                    <IconButton
                      icon={<RepeatIcon />}
                      onClick={handleRefresh}
                      isDisabled={!selectedUrl}
                      variant="ghost"
                      size="sm"
                      aria-label="Refresh"
                      color="#d1d5db"
                      _hover={{ bg: '#4b5563', color: '#f3f4f6' }}
                    />
                    <IconButton
                      icon={<ExternalLinkIcon />}
                      onClick={handleOpenExternal}
                      isDisabled={!selectedUrl}
                      variant="ghost"
                      size="sm"
                      aria-label="Open in external browser"
                      color="#d1d5db"
                      _hover={{ bg: '#4b5563', color: '#f3f4f6' }}
                    />
                  </HStack>
                </Box>

                {/* Full Screen Browser View */}
                <Box flex={1} bg="white" position="relative" minH={0}>
                  {selectedUrl ? (
                    <webview
                      ref={browserViewRef}
                      src={selectedUrl}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <Box
                      w="100%"
                      h="100%"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      bg="#f3f4f6"
                    >
                      <Box
                        w={16}
                        h={16}
                        bg="#e5e7eb"
                        borderRadius="3px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        mb={4}
                      >
                        <ExternalLinkIcon w={8} h={8} color="#6b7280" />
                      </Box>
                      <Text fontSize="lg" fontWeight="600" color="#4b5563" mb={2}>
                        No Service Selected
                      </Text>
                      <Text fontSize="sm" color="#6b7280" fontWeight="400">
                        Run a workflow to see services here
                      </Text>
                    </Box>
                  )}

                </Box>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* AI Assistant Sidebar */}
        <Box
          position="fixed"
          right={chatOpen ? 0 : '-400px'}
          top={0}
          bottom={0}
          w="400px"
          bg="#ffffff"
          borderLeft="1px solid"
          borderColor="#e5e7eb"
          display="flex"
          flexDirection="column"
          zIndex={1000}
          boxShadow="-2px 0 16px rgba(0, 0, 0, 0.1)"
          transition="right 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          overflow="hidden"
        >
          {/* Chat Header - Dark */}
          <Box
            px={4}
            py={3}
            borderBottom="1px solid"
            borderColor="#4b5563"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            bg="#374151"
            flexShrink={0}
          >
            <HStack spacing={2}>
              <Text fontSize="md" color="#f3f4f6" fontWeight="600">
                AI Assistant
              </Text>
              {chatMessages.length > 0 && (
                <Badge
                  bg="#4b5563"
                  color="#d1d5db"
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
              onClick={handleToggleChat}
              variant="ghost"
              size="sm"
              aria-label="Close chat"
              color="#d1d5db"
              _hover={{ bg: '#4b5563', color: '#f3f4f6' }}
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
            bg="#f9fafb"
          >
            {chatMessages.length === 0 ? (
              <Box textAlign="center" py={16}>
                <Text color="#6b7280" fontSize="md" fontWeight="500" mb={2}>
                  Ask for changes to your application
                </Text>
                <Text color="#9ca3af" fontSize="sm">
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
                    bg={msg.role === 'user' ? '#4b5563' : '#e5e7eb'}
                    color={msg.role === 'user' ? 'white' : '#374151'}
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
            borderColor="#e5e7eb"
            bg="#ffffff"
            flexShrink={0}
          >
            <HStack spacing={3}>
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask for changes..."
                bg="#ffffff"
                borderColor="#d1d5db"
                borderWidth="1px"
                size="md"
                fontSize="14px"
                fontWeight="400"
                letterSpacing="-0.01em"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && chatInput.trim()) {
                    const newMessage = { role: 'user', content: chatInput };
                    setChatMessages([...chatMessages, newMessage]);
                    setChatInput('');
                    // TODO: Send to AI and get response
                  }
                }}
                _hover={{ borderColor: '#9ca3af', bg: '#f9fafb' }}
                _focus={{ borderColor: '#6b7280', boxShadow: '0 0 0 3px rgba(107, 114, 128, 0.1)', bg: '#ffffff' }}
                _placeholder={{ color: '#9ca3af', fontWeight: '400', opacity: 1 }}
              />
              <Button
                size="md"
                bg="#4b5563"
                color="white"
                onClick={() => {
                  if (chatInput.trim()) {
                    const newMessage = { role: 'user', content: chatInput };
                    setChatMessages([...chatMessages, newMessage]);
                    setChatInput('');
                    // TODO: Send to AI and get response
                  }
                }}
                isDisabled={!chatInput.trim()}
                _hover={{ bg: '#374151' }}
                fontWeight="600"
                px={6}
              >
                Send
              </Button>
            </HStack>
          </Box>
        </Box>

        {/* AI Assistant Toggle Button - Fixed position */}
        <Box
          position="fixed"
          bottom="24px"
          right="24px"
          zIndex={999}
        >
          <IconButton
            icon={<ChatIcon />}
            onClick={handleToggleChat}
            size="lg"
            aria-label="Toggle AI Assistant"
            bg={chatOpen ? 'gray.700' : 'gray.600'}
            color="white"
            borderRadius="50%"
            boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
            _hover={{ bg: 'gray.700', transform: 'scale(1.05)' }}
            _active={{ transform: 'scale(0.95)' }}
            transition="all 0.2s"
            w="56px"
            h="56px"
          />
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;
