# backend/app/services/file_service.py
import io
import logging
from fastapi import UploadFile, HTTPException, status

logger = logging.getLogger(__name__)


class FileProcessingService:
    MAX_FILE_SIZE_MB = 25
    MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

    @classmethod
    async def extract_text(cls, file: UploadFile) -> str:
        # Validate file size
        file_size = 0
        contents = b""
        
        # Read chunks to verify file size securely
        while True:
            chunk = await file.read(1024 * 1024)  # 1MB chunks
            if not chunk:
                break
            file_size += len(chunk)
            if file_size > cls.MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {cls.MAX_FILE_SIZE_MB}MB.",
                )
            contents += chunk
            
        filename = file.filename.lower() if file.filename else ""
        logger.info(f"extract_text called: filename={filename}, size={file_size} bytes, content_start={contents[:100]}")
        
        if filename.endswith(".txt"):
            try:
                return contents.decode("utf-8")
            except UnicodeDecodeError:
                try:
                    return contents.decode("latin-1")
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Unable to decode text file: {e}",
                    )
                    
        elif filename.endswith(".pdf"):
            try:
                from pypdf import PdfReader
                pdf_file = io.BytesIO(contents)
                reader = PdfReader(pdf_file)
                text = ""
                for page_idx, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                
                cleaned_text = text.strip()
                if not cleaned_text:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Extracted PDF content is empty (could be image-only).",
                    )
                return cleaned_text
            except Exception as e:
                logger.error(f"Error parsing PDF file: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to extract text from PDF document: {str(e)}",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Please upload a PDF or TXT document.",
            )
