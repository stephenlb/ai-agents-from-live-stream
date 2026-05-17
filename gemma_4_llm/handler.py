"""
gemma_4_llm agent handler.
"""

from __future__ import annotations

from typing import Optional

from blocks_network import StartTaskMessage, TaskContext

import ollama


def handler(task: StartTaskMessage, ctx: Optional[TaskContext] = None) -> dict:
    """Handle an incoming task.

    Parameters
    ----------
    task : StartTaskMessage
        The incoming task message with request_parts.
    ctx : TaskContext, optional
        Task context for status reporting.

    Returns
    -------
    dict
        Result with "artifacts" key containing a list of {data, mimeType} entries.
    """
    # Extract text from the first request part
    text = ""
    for part in task.request_parts:
        if part.text is not None:
            text = str(part.text)
            break

    if not text:
        raise ValueError('Missing required field "text" in input')

    if ctx is not None:
        ctx.report_status("Processing...")

    response = ollama.chat(
        model="gemma4:e4b",
        messages=[{"role": "user", "content": text}],
    )
    print(response["message"]["content"])

    # Replace this with your agent logic
    return {
        "artifacts": [{
            "data": response["message"]["content"],
            "mimeType": "text/plain",
        }],
    }
