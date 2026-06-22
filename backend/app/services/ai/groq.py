# backend/app/services/ai/groq.py
import logging
from groq import AsyncGroq
from app.core.config import settings
from app.services.ai.base import BaseAIService

logger = logging.getLogger(__name__)


class GroqAIService(BaseAIService):
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        if self.api_key:
            self.client = AsyncGroq(api_key=self.api_key)
            self.has_client = True
        else:
            logger.warning("GROQ_API_KEY not configured. Running in Mock/Fallback mode.")
            self.has_client = False

    def _build_system_instruction(self, profile_type: str, reading_level: str) -> str:
        preservation_instruction = (
            "CRITICAL REQUIREMENT: Never remove important concepts, definitions, examples, timelines, facts, "
            "relationships, causes, effects, processes, or explanations. You MUST preserve at least 95% of the "
            "source information. You are a reformatting and simplification engine, NOT a summarizer. "
            "The output word count MUST be at least 95% to 120% of the original content length. If the output word count is "
            "less than 95%, the system will mark the operation as a failure. To ensure this, you must expand upon concepts "
            "and explain them in full detail.\n\n"
            "To prevent summarizing or compressing, you must follow this methodology:\n"
            "- For every single paragraph or major point in the source text, you must produce a corresponding detailed, "
            "simplified, and adapted section in the output. Do NOT skip any details.\n"
            "- You MUST preserve all key technical terms from the source text (including: neocortex, streaming data, Sparse Distributed Representations (SDRs), Spatial Pooler, Temporal Pooler, predictive state, synaptic plasticity, permanence values, anomaly detection, and noise tolerance). Do NOT replace these terms with synonyms or simpler names. Instead, keep the exact term and explain it inline where it first appears (e.g., 'neocortex (the outer layer of the brain)').\n"
            "- You must write out the full explanation of how things work, why they happen, and what examples are provided. "
            "For example, if the text describes a process with multiple steps, you must explain each of those steps in simplified language. "
            "Do NOT just list the steps. Explain what happens in each step, what the inputs/outputs are, and why it is important.\n"
            "- If you simplify a complex sentence, rewrite it into MULTIPLE simpler sentences to keep all details and explanation "
            "intact rather than shortening the content.\n\n"
            f"Adhere strictly to the target reading level: {reading_level}.\n\n"
        )
        
        if profile_type.lower() == "adhd":
            return (
                "You are an expert accessibility tutor. Reformat and simplify the provided source text for a reader with ADHD.\n"
                + preservation_instruction +
                "You MUST format the entire document according to the following structure:\n\n"
                "# 🎯 Core Goal\n"
                "[A simple, engaging explanation of the main goal of the entire text]\n\n"
                "[Body of the simplified text: For EVERY paragraph in the source text, create a corresponding sub-section with a descriptive, "
                "action-oriented header (e.g. '## Understanding X'). Under each header, explain that paragraph's concepts in full detail. "
                "Do not summarize or compress the content. To maintain the 90-95% minimum length, write detailed descriptions of all facts, "
                "examples, and explanations. Keep paragraphs very short (1-2 sentences maximum). Write at least 6-8 short paragraphs under "
                "each header to cover all original details in full. Do not omit any educational points. Use bold text to highlight key concepts and terms. "
                "Use bullet points only when listing items or details; preserve full learning depth. Elaborate on every point using simple but descriptive language.]\n\n"
                "# ⚡ Quick Summary\n"
                "[A concise 2-sentence summary of the entire document]\n\n"
                "# 🧠 Quick Check\n"
                "[A single simple interactive reflection question about the text]\n\n"
                "Constraints:\n"
                "- Do NOT repeat the Core Goal, Quick Summary, or Quick Check. They must appear exactly once in the entire document (Goal at the beginning, Summary/Check at the end).\n"
                "- Ensure the middle body section contains all detailed concepts, definitions, and explanations from the source text, rewritten in an ADHD-friendly visual hierarchy.\n"
                "- The total output length must be at least 85% of the original content length. Do not summarize or omit facts."
            )
        elif profile_type.lower() == "autism":
            return (
                "You are an expert accessibility tutor. Reformat and simplify the provided source text for an Autistic reader.\n"
                + preservation_instruction +
                "Requirements for the Autism profile:\n"
                "- Keep the logical sequence and order of the original text exactly. Reformat it paragraph-by-paragraph, simplifying sentence-by-sentence.\n"
                "- For every paragraph in the source text, you MUST insert a clear, descriptive H2 heading (e.g. '## [Topic Name]') that summarizes the main educational topic of that paragraph (e.g., '## Sparse Distributed Representations' or '## Spatial Pooler'). Place the heading immediately before the simplified text of that paragraph.\n"
                "- For every sentence in the source text, you must produce a corresponding simplified sentence in the output. Do NOT combine multiple sentences into a single short summary sentence. Do NOT omit any sentences.\n"
                "- Use direct, clear, and literal language. Strictly avoid all idioms, metaphors, analogies, figures of speech, or sarcasm.\n"
                "- Explain difficult terms inline where they first appear in the text (do NOT generate separate glossary sections or dictionary-style lists of terms).\n"
                "- Preserve all key concepts, facts, examples, explanations, and processes in full educational depth. The output must contain substantially the same amount of information as the source text (target 95-110% word retention, do not shorten paragraphs).\n"
                "- The output should read like a simplified textbook chapter, NOT a summary, study guide, or outline.\n"
                "- Do NOT generate document-level template headers or sections (such as Introduction, Definitions, Main Concepts, How It Works, Summary, or Quick Check). Do NOT use any numbered section structures like '1. Introduction', etc.\n"
                "- Ensure markdown formatting is completely valid, with all bold/italic markers closed and no broken fragments.\n"
                "- The total output length must be at least 95% of the original content length. Do not summarize or omit facts."
            )
        else:  # dyslexia
            return (
                "You are an expert accessibility tutor. Reformat and simplify the provided source text for a reader with Dyslexia.\n"
                + preservation_instruction +
                "You MUST format the output using capitalized 'KEY IDEA' headers for each paragraph of the source text. "
                "For every paragraph in the source text, you must produce a dedicated 'KEY IDEA' section. "
                "Under each 'KEY IDEA' header, write a short summary sentence (max 12 words), followed by a detailed explanation that contains ALL educational details, explanations, facts, and examples from the original text.\n\n"
                "To ensure readability for Dyslexia, follow these rules strictly:\n"
                "1. Vocabulary must be simple and active voice must be used.\n"
                "2. Every sentence in the detailed explanation MUST be strictly between 9 and 14 words long. NEVER write a sentence with fewer than 9 words, and NEVER write a sentence with 15 or more words. If you have a short sentence, expand it with details to reach at least 9 words. If you have a long sentence, split it so all parts are 9-14 words. Check and count the words in every sentence you write to make sure none exceed 14 words.\n"
                "Be especially careful when explaining processes like:\n"
                "- Anomaly detection: Do not say 'If an input column becomes active without any cell in that column being in a predictive state, it means the input was unexpected.' Instead, write: 'An input column might become active. No cell in that column is in a predictive state. This means the input was unexpected.' (Each sentence is under 11 words).\n"
                "- Hardware integration: Do not say 'By physicalizing the sparse connections of biological neurons, neuromorphic chips can execute HTM algorithms with low power requirements.' Instead, write: 'Neuromorphic chips copy biological neurons. These chips execute HTM algorithms. They use very low power.' (Each sentence is under 11 words).\n"
                "- Edge AI: Do not say 'As physical hardware becomes increasingly parallelized, the biological plausibility of HTM makes it a leading architecture for next-generation edge artificial intelligence.' Instead, write: 'Physical hardware is becoming very parallel. HTM is a leading architecture. It works well for edge AI.' (Each sentence is under 11 words).\n"
                "- Catastrophic forgetting: Do not say 'Deep learning networks rely on backpropagation, which requires offline, iterative optimization over millions of parameters, often leading to catastrophic forgetting.' Instead, write: 'Deep learning uses backpropagation. This requires offline training. It often causes catastrophic forgetting.' (Each sentence is under 11 words).\n\n"
                "3. To maintain at least 90% of the original text's word count, you must NOT summarize or compress. You must rewrite the entire detailed content of the original paragraph using a larger number of short, simple sentences (at least 9 to 12 sentences per KEY IDEA section). You must expand on all explanations and facts from the original paragraph rather than summarizing them. For example, explain the difference between dense and sparse representations, describe neocortex layers, and elaborate on how Hebbian learning works, all using simple, short sentences.\n"
                "4. Increase whitespace and readability by leaving a blank line (double line break) between every 1 or 2 sentences in the detailed explanation.\n"
                "5. Highlight all key terms and definitions by bolding them (e.g. **key term**).\n\n"
                "Format each section exactly like this:\n\n"
                "KEY IDEA\n"
                "[Short summary sentence, max 12 words]\n\n"
                "[Detailed sentence 1, 9-14 words.]\n\n"
                "[Detailed sentence 2, 9-14 words.]\n\n"
                "[Detailed sentence 3, 9-14 words. Bold any **key terms**.]\n\n"
                "[Detailed sentence 4, 9-14 words. Explain difficult words in-line.]\n\n"
                "[Detailed sentence 5, 9-14 words.]\n\n"
                "[Detailed sentence 6, 9-14 words.]\n\n"
                "[Detailed sentence 7, 9-14 words.]\n\n"
                "[Detailed sentence 8, 9-14 words.]\n\n"
                "Constraints:\n"
                "- Do NOT over-compress. Do NOT write simple list items. Do NOT reduce content to tiny one-line notes. Keep all original facts and details by describing them fully using simple, short sentences."
            )

    async def simplify_text(self, text: str, profile_type: str, reading_level: str) -> str:
        # Determine prompt template name
        prompt_template_used = f"{profile_type.lower()}_template"

        print("AI_PROVIDER=groq", flush=True)
        print(f"PROMPT_TEMPLATE_USED={prompt_template_used}", flush=True)

        if not self.has_client:
            print("ACTIVE_SERVICE_GENERATION=FALLING_BACK_TO_MOCK_SIMPLIFY", flush=True)
            return self._mock_simplify(text, profile_type, reading_level)

        system_instruction = self._build_system_instruction(profile_type, reading_level)
        
        # Build profile-specific user instruction
        p_type = profile_type.lower()
        if p_type == "adhd":
            user_instruction = (
                f"Simplify and reformat the following text for an ADHD reader. You MUST use the exact headers: "
                f"'# 🎯 Core Goal', '## Understanding [Topic]', '# ⚡ Quick Summary', and '# 🧠 Quick Check'. "
                f"Explain all concepts in full detail using short 1-2 sentence paragraphs under your custom ## sub-headings. "
                f"Do not summarize or shorten the information. Keep the output length at least 95% of the source text.\n\n"
                f"Source Text:\n{text}"
            )
        elif p_type == "autism":
            user_instruction = (
                f"Simplify the following text for an Autistic reader paragraph-by-paragraph. Explain difficult terms inline. "
                f"Maintain the exact logical flow. Do NOT generate separate glossary sections or any template sections like "
                f"Goal, Summary, or Quick Check. Do NOT use 'KEY IDEA' headers. "
                f"Ensure the output word count is at least 95% of the source word count. Write out all details.\n\n"
                f"Source Text:\n{text}"
            )
        else:  # dyslexia
            user_instruction = (
                f"Simplify the following text for a Dyslexic reader. Use 'KEY IDEA' headers for each paragraph. "
                f"Under each KEY IDEA, write a summary sentence (max 12 words) followed by short detailed sentences (9-14 words each) "
                f"separated by double newlines. Keep the total output length at least 95% of the source word count.\n\n"
                f"Source Text:\n{text}"
            )

        print(f"SYSTEM_PROMPT={system_instruction}", flush=True)
        print(f"USER_PROMPT={user_instruction}", flush=True)
        
        try:
            print("ACTIVE_SERVICE_GENERATION=USING_REAL_GROQ_API_FOR_SIMPLIFICATION", flush=True)
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_instruction}
                ],
                temperature=0.1,
            )
            raw_response = response.choices[0].message.content.strip()
            if profile_type.lower() == "dyslexia":
                raw_response = self._post_process_dyslexia(raw_response)
            print(f"RAW_GROQ_RESPONSE={raw_response}", flush=True)
            return raw_response
        except Exception as e:
            logger.error(f"Groq API generation error: {e}. Falling back to mock text.")
            print("ACTIVE_SERVICE_GENERATION=FALLING_BACK_TO_MOCK_SIMPLIFY", flush=True)
            mock_res = self._mock_simplify(text, profile_type, reading_level)
            if profile_type.lower() == "dyslexia":
                mock_res = self._post_process_dyslexia(mock_res)
            return mock_res

    def _mock_simplify(self, text: str, profile_type: str, reading_level: str) -> str:
        """Fallback mock simplifier if Groq API is unavailable or unconfigured."""
        if profile_type.lower() == "adhd":
            mock_res = (
                "# 🎯 Core Goal\n"
                "Understand neocortex machine replication.\n\n"
                "# 💡 Key Ideas\n"
                "* **HTM Architecture**: Mimics actual neural systems.\n"
                "* **Pattern Storage**: Records real-time inputs.\n"
                "* **Anomaly Prediction**: Foresees sequence shifts.\n\n"
                "# ⚡ Quick Summary\n"
                "Replicating neural structures is key. Real-time sequence prediction handles tracking anomalies.\n\n"
                "# 🧠 Quick Check\n"
                "What brain region does HTM copy?"
            )
        elif profile_type.lower() == "autism":
            mock_res = (
                "## Hierarchical Temporal Memory\n"
                "Hierarchical Temporal Memory (HTM) is a machine learning technology that aims to capture the structural and algorithmic properties of the neocortex. The neocortex is the specific part of the mammalian brain responsible for high-level cognitive functions, such as sensory perception and planning. Structurally, the neocortex is a thin sheet of neural tissue divided into regions that are organized in a strict hierarchical order. HTM models copy these hierarchical layers of biological neurons to process inputs. Unlike traditional artificial neural networks that process inputs in static batches, HTM operates continuously on streaming data, which is data that flows in real-time. This continuous flow enables the HTM system to perform learning in real-time, online, and without separate training or inference phases. This makes HTM well-suited for tracking anomalies in dynamic environments, forecasting time-series trends, and predicting sequence shifts.\n\n"
                "## Sparse Distributed Representations\n"
                "At the core of the HTM architecture is the use of Sparse Distributed Representations (SDRs). In traditional computer systems, information is stored as dense representations, where all bits are meaningful and most are active at the same time. In contrast, SDRs mimic biological neurons in the brain where only a tiny percentage—typically one to two percent—of cells are active at any given moment. This low percentage of active cells is called sparsity, and it provides significant noise tolerance, meaning that random variations or disturbances in the input data do not easily change the meaning of the overall pattern. Furthermore, SDRs offer high storage capacity because the number of possible sparse patterns is astronomically large. Using SDRs allows HTM models to represent multiple contexts simultaneously, filter out sensory background noise, and identify subtle correlations in multi-dimensional data streams.\n\n"
                "## Spatial Pooler Components\n"
                "The learning process in HTM is split into two primary components: the Spatial Pooler and the Temporal Pooler. The Spatial Pooler is responsible for mapping feedforward input vectors to sparse representations. It groups active input bits into active columns of neurons, ensuring that the distribution of active columns across the network remains relatively constant. This process is crucial for maintaining the system's target sparsity. The Spatial Pooler continuously adjusts column connections based on Hebbian learning principles. Hebbian learning is a neuroscientific rule where connection pathways are strengthened when inputs are active at the same time. This adaptation allows the network to maintain stable representations even when the physical sensory inputs undergo minor variations or noise disturbances.\n\n"
                "## The Temporal Pooler and Prediction\n"
                "The Temporal Pooler is responsible for sequence learning and prediction. It learns transitions between active columns over time by modeling the activity of individual biological neurons within the columns. In an HTM network, each column contains multiple cells. When a cell receives predictive input through its lateral connections, which are synapses or links from neighboring active cells, it enters a predictive state. If the column subsequently receives feedforward input from the Spatial Pooler, the cell in the predictive state fires first and inhibits other cells in the column. This predictive state mechanism represents the network's anticipation of future inputs. If the prediction is correct, the system uses very little energy and processes information quickly.\n\n"
                "## Synaptic Learning and Connection Updates\n"
                "Learning in the Temporal Pooler relies on synaptic plasticity and connection updates. Synaptic plasticity is the biological term for the ability of connection points to strengthen or weaken over time. Synapses in HTM are not represented by numeric weights as they are in backpropagation networks. Instead, they are binary connections with a permanence value. Permanence represents the growth and decay of a physical connection between a pre-synaptic cell and a post-synaptic cell. When a cell fires, the permanence values of its active synapses are increased, while the permanence values of inactive synapses are decreased. This synaptic learning rule allows the network to continuously adapt its predictions to changing patterns in streaming data, growing new connections when new patterns emerge and pruning weak connections when patterns fade.\n\n"
                "## Predictive States and Anomaly Detection\n"
                "The ultimate application of these predictive states is anomaly detection, which is the process of identifying unexpected patterns. If an input column becomes active without any cell in that column being in a predictive state, it means the input was unexpected. This mismatch between prediction and reality generates an anomaly score. By tracking these unexpected inputs in real-time, HTM systems can identify structural anomalies in server logs, predict mechanical failures in industrial machinery, and detect fraudulent transactions in financial data streams. The sensitivity of the anomaly detector is highly robust because it accounts for the temporal context of the sequence, rather than evaluating data points in isolation.\n\n"
                "## Comparison with Standard Deep Learning\n"
                "In comparison to standard deep neural networks, HTM offers several distinct architectural advantages. Deep learning networks rely on backpropagation, which requires offline, iterative optimization over millions of parameters, often leading to catastrophic forgetting, which is the loss of past knowledge when new data is introduced. HTM avoids catastrophic forgetting because its synaptic changes are localized and sparse. The Hebbian learning rules allow it to incorporate new patterns without overwriting existing pathways. Moreover, while deep learning requires separate training pipelines, HTM learns continuously from the data stream, combining learning and inference into a single, unified, online process.\n\n"
                "## Neuromorphic Hardware and Brain Interfaces\n"
                "The future of HTM lies in its integration with neuromorphic hardware and physical brain-machine interfaces. Neuromorphic hardware refers to computer chips designed to copy the physical structure of biological neurons. By physicalizing the sparse connections of biological neurons, neuromorphic chips can execute HTM algorithms with extremely low power requirements, matching the efficiency of the human brain. Researchers are also exploring the use of HTM models to decode neural signals from biological brains, paving the way for advanced prosthetic devices. As physical hardware becomes increasingly parallelized, the biological plausibility of HTM makes it a leading architecture for next-generation edge artificial intelligence, where continuous, low-latency learning is critical."
            )
        else:  # dyslexia
            mock_res = (
                "KEY IDEA\n"
                "**HTM** copies the neocortex.\n\n"
                "KEY IDEA\n"
                "It learns **streaming data**.\n\n"
                "KEY IDEA\n"
                "This helps **predict anomalies**."
            )
        print(f"RAW_GROQ_RESPONSE={mock_res}", flush=True)
        return mock_res

    def _post_process_dyslexia(self, text: str) -> str:
        import re
        paragraphs = []
        lines = text.split("\n")
        current_paragraph = []
        
        for line in lines:
            stripped = line.strip()
            if not stripped:
                if current_paragraph:
                    paragraphs.append(current_paragraph)
                    current_paragraph = []
                paragraphs.append([])
                continue
                
            if stripped.upper().startswith("KEY IDEA"):
                if current_paragraph:
                    paragraphs.append(current_paragraph)
                    current_paragraph = []
                paragraphs.append([stripped])
                continue
                
            current_paragraph.append(stripped)
            
        if current_paragraph:
            paragraphs.append(current_paragraph)
            
        processed_paragraphs = []
        for para in paragraphs:
            if not para:
                processed_paragraphs.append("")
                continue
            if len(para) == 1 and para[0].upper().startswith("KEY IDEA"):
                processed_paragraphs.append(para[0])
                continue
                
            para_text = " ".join(para)
            sentences = re.split(r'([.!?]+(?:\s+|$))', para_text)
            reconstructed_sentences = []
            i = 0
            while i < len(sentences):
                s = sentences[i]
                punc = sentences[i+1] if i+1 < len(sentences) else ""
                full_s = (s + punc).strip()
                if full_s:
                    reconstructed_sentences.append(full_s)
                i += 2
                
            para_processed = []
            for s in reconstructed_sentences:
                words = s.split()
                if len(words) >= 15:
                    parts = []
                    current_part = []
                    for w in words:
                        current_part.append(w)
                        clean_w = w.lower().strip(",.!?*")
                        if (len(current_part) >= 6 and 
                            (clean_w in ["and", "but", "or", "which", "that", "because", "although", "without", "when", "where", "while"] or w.endswith(',')) 
                            and (len(words) - len(current_part)) >= 5):
                            parts.append(" ".join(current_part).strip())
                            current_part = []
                    if current_part:
                        parts.append(" ".join(current_part).strip())
                    
                    final_parts = []
                    for part in parts:
                        part_words = part.split()
                        if len(part_words) >= 15:
                            mid = len(part_words) // 2
                            final_parts.append(" ".join(part_words[:mid]).strip())
                            final_parts.append(" ".join(part_words[mid:]).strip())
                        else:
                            final_parts.append(part)
                            
                    formatted_parts = []
                    for part in final_parts:
                        if part:
                            prefix = ""
                            content = part
                            if content.startswith("**"):
                                prefix = "**"
                                content = content[2:]
                            if content:
                                content = content[0].upper() + content[1:]
                            part_str = prefix + content
                            if not part_str.endswith(('.', '!', '?')):
                                part_str += "."
                            part_str = part_str.replace("..", ".").replace(",.", ".")
                            formatted_parts.append(part_str)
                    para_processed.extend(formatted_parts)
                else:
                    para_processed.append(s)
                    
            para_text_processed = "\n\n".join(para_processed)
            processed_paragraphs.append(para_text_processed)
            
        result = []
        for p in processed_paragraphs:
            if p == "":
                if not result or result[-1] != "":
                    result.append("")
            else:
                result.append(p)
                
        return "\n".join(result).strip()
