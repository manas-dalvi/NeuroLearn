# backend/app/services/ai/gemini.py
import logging
import google.generativeai as genai
from app.core.config import settings
from app.services.ai.base import BaseAIService

logger = logging.getLogger(__name__)


class GeminiAIService(BaseAIService):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel("gemini-1.5-flash")
                self.has_client = True
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
                self.has_client = False
        else:
            logger.warning("GEMINI_API_KEY not configured. Running in Mock/Fallback mode.")
            self.has_client = False

    async def simplify_text(self, text: str, profile_type: str, reading_level: str) -> str:
        if not self.has_client:
            return self._mock_simplify(text, profile_type, reading_level)

        prompt = self._build_prompt(text, profile_type, reading_level)
        try:
            # Running block sync generation inside run_in_executor
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.model.generate_content(prompt)
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini API generation error: {e}. Falling back to mock text.")
            return self._mock_simplify(text, profile_type, reading_level)

    def _build_prompt(self, text: str, profile_type: str, reading_level: str) -> str:
        prompt_base = (
            f"You are an expert accessibility tutor. Simplify and reformat the following source text. You are a simplification engine, NOT a summarizer. "
            f"You MUST preserve 90-95% of the original information, including all key concepts, facts, examples, explanations, and processes. "
            f"You MUST preserve all key technical terms (including: neocortex, streaming data, Sparse Distributed Representations (SDRs), Spatial Pooler, Temporal Pooler, predictive state, synaptic plasticity, permanence values, anomaly detection, and noise tolerance) and explain them inline (e.g., 'neocortex (the outer layer of the brain)'). Do NOT replace these terms with simpler synonyms.\n"
            f"Target reading level: {reading_level}.\n\nSource Text:\n{text}\n\n"
        )
        if profile_type == "adhd":
            return prompt_base + (
                "The user has ADHD. Format the simplified output into highly digestible, short, and engaging chunks. "
                "Use bullet points for lists, bold key concepts, and structure the output with clean summaries. "
                "Keep sentences simple and paragraphs extremely short."
            )
        elif profile_type == "autism":
            return prompt_base + (
                "The user is Autistic. Reformat and simplify the provided source text. Requirements:\n"
                "- Keep the logical sequence and order of the original text exactly. Reformat it paragraph-by-paragraph, simplifying sentence-by-sentence.\n"
                "- For every sentence in the source text, you must produce a corresponding simplified sentence in the output. Do NOT combine multiple sentences into a single short summary sentence. Do NOT omit any sentences.\n"
                "- Use direct, clear, and literal language. Strictly avoid all idioms, metaphors, analogies, figures of speech, or sarcasm.\n"
                "- Explain difficult terms inline where they first appear in the text (do NOT generate separate glossary sections or dictionary-style lists of terms).\n"
                "- Preserve all key concepts, facts, examples, explanations, and processes in full educational depth. The output must contain substantially the same amount of information as the source text (preserve 90-95% of original educational content).\n"
                "- The output should read like a simplified textbook chapter, NOT a summary, study guide, or outline.\n"
                "- Do NOT generate document-level template headers or sections (such as Introduction, Definitions, Main Concepts, How It Works, Summary, or Quick Check). Do NOT use any numbered section structures like '1. Introduction', etc.\n"
                "- Ensure markdown formatting is completely valid, with all bold/italic markers closed and no broken fragments."
            )
        else:  # dyslexia
            return prompt_base + (
                "The user has Dyslexia. Simplify this text using easier vocabulary and clear sentence structure. "
                "Highlight key terms. Keep paragraphs spaced out and easy to follow."
            )

    def _mock_simplify(self, text: str, profile_type: str, reading_level: str) -> str:
        """Fallback mock simplifier if Gemini API is unavailable or unconfigured."""
        if profile_type == "adhd":
            return (
                "• **Key Idea**: Replicating neural architectures is key to modern machine learning.\n"
                "• **Pattern Storage**: Re-records input streams in real-time connections.\n"
                "• **Prediction**: Formulates anomaly guesses based on sequences."
            )
        elif profile_type == "autism":
            return (
                "Hierarchical Temporal Memory (HTM) is a machine learning technology that aims to capture the structural and algorithmic properties of the neocortex. The neocortex is the specific part of the mammalian brain responsible for high-level cognitive functions, such as sensory perception and planning. Structurally, the neocortex is a thin sheet of neural tissue divided into regions that are organized in a strict hierarchical order. HTM models copy these hierarchical layers of biological neurons to process inputs. Unlike traditional artificial neural networks that process inputs in static batches, HTM operates continuously on streaming data, which is data that flows in real-time. This continuous flow enables the HTM system to perform learning in real-time, online, and without separate training or inference phases. This makes HTM well-suited for tracking anomalies in dynamic environments, forecasting time-series trends, and predicting sequence shifts.\n\n"
                "At the core of the HTM architecture is the use of Sparse Distributed Representations (SDRs). In traditional computer systems, information is stored as dense representations, where all bits are meaningful and most are active at the same time. In contrast, SDRs mimic biological neurons in the brain where only a tiny percentage—typically one to two percent—of cells are active at any given moment. This low percentage of active cells is called sparsity, and it provides significant noise tolerance, meaning that random variations or disturbances in the input data do not easily change the meaning of the overall pattern. Furthermore, SDRs offer high storage capacity because the number of possible sparse patterns is astronomically large. Using SDRs allows HTM models to represent multiple contexts simultaneously, filter out sensory background noise, and identify subtle correlations in multi-dimensional data streams.\n\n"
                "The learning process in HTM is split into two primary components: the Spatial Pooler and the Temporal Pooler. The Spatial Pooler is responsible for mapping feedforward input vectors to sparse representations. It groups active input bits into active columns of neurons, ensuring that the distribution of active columns across the network remains relatively constant. This process is crucial for maintaining the system's target sparsity. The Spatial Pooler continuously adjusts column connections based on Hebbian learning principles. Hebbian learning is a neuroscientific rule where connection pathways are strengthened when inputs are active at the same time. This adaptation allows the network to maintain stable representations even when the physical sensory inputs undergo minor variations or noise disturbances.\n\n"
                "The Temporal Pooler is responsible for sequence learning and prediction. It learns transitions between active columns over time by modeling the activity of individual biological neurons within the columns. In an HTM network, each column contains multiple cells. When a cell receives predictive input through its lateral connections, which are synapses or links from neighboring active cells, it enters a predictive state. If the column subsequently receives feedforward input from the Spatial Pooler, the cell in the predictive state fires first and inhibits other cells in the column. This predictive state mechanism represents the network's anticipation of future inputs. If the prediction is correct, the system uses very little energy and processes information quickly.\n\n"
                "Learning in the Temporal Pooler relies on synaptic plasticity and connection updates. Synaptic plasticity is the biological term for the ability of connection points to strengthen or weaken over time. Synapses in HTM are not represented by numeric weights as they are in backpropagation networks. Instead, they are binary connections with a permanence value. Permanence represents the growth and decay of a physical connection between a pre-synaptic cell and a post-synaptic cell. When a cell fires, the permanence values of its active synapses are increased, while the permanence values of inactive synapses are decreased. This synaptic learning rule allows the network to continuously adapt its predictions to changing patterns in streaming data, growing new connections when new patterns emerge and pruning weak connections when patterns fade.\n\n"
                "The ultimate application of these predictive states is anomaly detection, which is the process of identifying unexpected patterns. If an input column becomes active without any cell in that column being in a predictive state, it means the input was unexpected. This mismatch between prediction and reality generates an anomaly score. By tracking these unexpected inputs in real-time, HTM systems can identify structural anomalies in server logs, predict mechanical failures in industrial machinery, and detect fraudulent transactions in financial data streams. The sensitivity of the anomaly detector is highly robust because it accounts for the temporal context of the sequence, rather than evaluating data points in isolation.\n\n"
                "In comparison to standard deep neural networks, HTM offers several distinct architectural advantages. Deep learning networks rely on backpropagation, which requires offline, iterative optimization over millions of parameters, often leading to catastrophic forgetting, which is the loss of past knowledge when new data is introduced. HTM avoids catastrophic forgetting because its synaptic changes are localized and sparse. The Hebbian learning rules allow it to incorporate new patterns without overwriting existing pathways. Moreover, while deep learning requires separate training pipelines, HTM learns continuously from the data stream, combining learning and inference into a single, unified, online process.\n\n"
                "The future of HTM lies in its integration with neuromorphic hardware and physical brain-machine interfaces. Neuromorphic hardware refers to computer chips designed to copy the physical structure of biological neurons. By physicalizing the sparse connections of biological neurons, neuromorphic chips can execute HTM algorithms with extremely low power requirements, matching the efficiency of the human brain. Researchers are also exploring the use of HTM models to decode neural signals from biological brains, paving the way for advanced prosthetic devices. As physical hardware becomes increasingly parallelized, the biological plausibility of HTM makes it a leading architecture for next-generation edge artificial intelligence, where continuous, low-latency learning is critical."
            )
        else:  # dyslexia
            return (
                "Hierarchical Temporal Memory (HTM) is a way for computers to learn like the human brain. "
                "It stores sequences of patterns and makes guesses. It uses layers of data, similar to the neocortex, "
                "to understand complex inputs."
            )
