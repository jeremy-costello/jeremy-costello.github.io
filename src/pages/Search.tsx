import { useState, useEffect } from 'react';
import { Box, Typography, Button, LinearProgress, Paper, Link, CircularProgress } from '@mui/material';
import SimilaritySearch from '../components/search/SimilaritySearch';
import PageHeader from '../components/layout/PageHeader';
import { initEmbedder, EMBED_MODEL_REPO, EMBED_MODEL_FILE } from '../services/embed';
import { ModelManager } from '@wllama/wllama';
import { initDB } from '../services/db';

interface Progress {
  loaded: number;
  total: number;
}

const Search = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [embedderProgress, setEmbedderProgress] = useState<number | null>(null);
  const [checkingLocal, setCheckingLocal] = useState(true);
  const [sharedArrayBufferAvailable, setSharedArrayBufferAvailable] = useState(true);

  const embeddingModelFilename = EMBED_MODEL_FILE;
  const embeddingModelResolveUrl = `https://huggingface.co/${EMBED_MODEL_REPO}/resolve/main/${embeddingModelFilename}`;
  const embeddingModelBlobUrl = `https://huggingface.co/${EMBED_MODEL_REPO}/blob/main/${embeddingModelFilename}`;

  useEffect(() => {
    // Check SharedArrayBuffer availability
    if (typeof window.SharedArrayBuffer === "undefined") {
      setSharedArrayBufferAvailable(false);
      return; // stop early — user must refresh or continue without
    }

    const checkModelDownloaded = async () => {
      try {
        const manager = new ModelManager({ allowOffline: true });
        const models = await manager.getModels();
        const isModelPresent = models.some(model => model.url === embeddingModelResolveUrl);

        if (isModelPresent) {
          await initDB();
          await initEmbedder(); // safe to call again — idempotent
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('Error checking local model cache:', err);
      } finally {
        setCheckingLocal(false);
      }
    };

    checkModelDownloaded();
  }, []);

  const handleInit = async () => {
    setIsLoading(true);
    try {
      await initDB();
      await initEmbedder(({ loaded, total }: Progress) => {
        const percent = Math.round((loaded / total) * 100);
        setEmbedderProgress(percent);
      });
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to load embedder model:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚨 Block everything if SharedArrayBuffer isn't available
  if (!sharedArrayBufferAvailable) {
    return (
      <PageHeader title="Cross-Origin Isolation Required">
        <Box sx={{ p: 4, textAlign: 'center', maxWidth: 600, margin: 'auto' }}>
          <Typography variant="h5" gutterBottom>
            ⚠️ SharedArrayBuffer Not Available
          </Typography>
          <Typography variant="body1" paragraph>
            This page requires <code>SharedArrayBuffer</code> for correct operation.
            <br />
            Please refresh the page to enable cross-origin isolation.
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </Box>
        </Box>
      </PageHeader>
    );
  }

  // Still checking local model cache
  if (checkingLocal) {
    return (
      <PageHeader title="Checking Local Models">
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            Checking if the embedding model is already downloaded...
          </Typography>
          <CircularProgress />
        </Box>
      </PageHeader>
    );
  }

  // Not initialized yet — show download/init screen
  if (!isInitialized) {
    return (
      <PageHeader title="Semantic Search Initialization Required">
        <Box sx={{ p: 4, maxWidth: 700, margin: 'auto', textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            ⚠️ Model Download Required
          </Typography>
          <Typography variant="body1" paragraph>
            This page requires downloading one model from Hugging Face.
            <br />
            Depending on your connection, this may take several minutes.
          </Typography>

          <Typography variant="body2" gutterBottom>
            Required model:
          </Typography>
          <ul style={{ textAlign: 'center', marginTop: 8 }}>
            <li>
              <Link href={embeddingModelBlobUrl} target="_blank" rel="noopener">
                {embeddingModelFilename}
              </Link>
            </li>
          </ul>

          <Box sx={{ mt: 4 }}>
            {!isLoading ? (
              <Button variant="contained" color="primary" onClick={handleInit}>
                Download & Initialize Model
              </Button>
            ) : (
              <>
                <Typography variant="body2" gutterBottom>
                  Downloading Embedding Model... {embedderProgress ?? 0}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={embedderProgress ?? 0}
                  sx={{ mt: 1 }}
                />
              </>
            )}
          </Box>
        </Box>
      </PageHeader>
    );
  }

  // Model initialized — show actual search page
  return (
    <PageHeader title="Semantic Search">
      <Paper 
        elevation={3}
        sx={{ 
          p: 4,
          borderRadius: 2
        }}
      >
        <SimilaritySearch />
      </Paper>
    </PageHeader>
  );
};

export default Search;
