from io import BytesIO
import json
import os
import re
from typing import Any, Dict, List, Optional
from pypdf import PdfReader
from backend.core.logging import logger
from backend.db.database import SessionLocal
from backend.db.models import DocumentModel, generate_uuid


class DocumentRAGService:
    def __init__(self):
        self.documents_index: List[Dict[str, Any]] = []

    def load_pdf(self, content: bytes, filename: str, dataset_id: Optional[str] = None) -> Dict[str, Any]:
        """Extracts text from PDF and indexes chunks with page citations."""
        try:
            reader = PdfReader(BytesIO(content))
            pages_data: List[Dict[str, Any]] = []
            full_text = []

            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                cleaned = re.sub(r"\s+", " ", page_text).strip()
                if cleaned:
                    pages_data.append({
                        "page_number": idx + 1,
                        "text": cleaned,
                    })
                    full_text.append(f"[Page {idx + 1}] {cleaned}")

            combined_text = "\n\n".join(full_text)
            doc_id = generate_uuid()

            db = SessionLocal()
            try:
                doc_record = DocumentModel(
                    id=doc_id,
                    dataset_id=dataset_id,
                    filename=filename,
                    content_text=combined_text,
                    metadata_json=json.dumps({"total_pages": len(reader.pages), "pages": pages_data}),
                )
                db.add(doc_record)
                db.commit()
            finally:
                db.close()

            # Cache in memory
            self.documents_index.append({
                "doc_id": doc_id,
                "dataset_id": dataset_id,
                "filename": filename,
                "pages": pages_data,
            })

            return {
                "doc_id": doc_id,
                "filename": filename,
                "pages_indexed": len(pages_data),
                "total_pages": len(reader.pages),
                "preview": pages_data[0]["text"][:200] if pages_data else "",
            }
        except Exception as e:
            logger.error(f"Failed to ingest PDF document: {e}")
            raise ValueError(f"Could not parse PDF: {str(e)}") from e

    def search_context(self, query: str, dataset_id: Optional[str] = None, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieves most relevant document passages with page citations."""
        query_terms = set(re.findall(r"\w+", query.lower()))
        if not query_terms:
            return []

        # Load from DB if memory index is empty
        if not self.documents_index:
            db = SessionLocal()
            try:
                docs = db.query(DocumentModel).all()
                for d in docs:
                    meta = json.loads(d.metadata_json or "{}")
                    self.documents_index.append({
                        "doc_id": d.id,
                        "dataset_id": d.dataset_id,
                        "filename": d.filename,
                        "pages": meta.get("pages", []),
                    })
            finally:
                db.close()

        scored_chunks: List[Dict[str, Any]] = []

        for doc in self.documents_index:
            if dataset_id and doc.get("dataset_id") and doc.get("dataset_id") != dataset_id:
                continue

            for page in doc.get("pages", []):
                p_text = page["text"]
                words = set(re.findall(r"\w+", p_text.lower()))
                overlap = len(query_terms.intersection(words))
                if overlap > 0:
                    scored_chunks.append({
                        "score": overlap,
                        "doc_id": doc["doc_id"],
                        "filename": doc["filename"],
                        "page_number": page["page_number"],
                        "snippet": p_text[:400] + ("..." if len(p_text) > 400 else ""),
                    })

        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]


document_rag_service = DocumentRAGService()
