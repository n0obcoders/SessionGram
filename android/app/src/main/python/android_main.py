"""Entry point called from the Android service (Chaquopy)."""
import logging


def run(data_dir, static_dir, port, token, notifier):
    import server
    logging.getLogger().setLevel(logging.INFO)
    server.run_embedded(str(data_dir), str(static_dir), int(port), str(token), notifier)
