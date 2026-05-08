from pathlib import Path

import kagglehub


DATASET_HANDLE = "macgence/construction-site-video-dataset"
OUTPUT_DIR = Path(__file__).resolve().parent / "construction-site-video-dataset"


def main() -> None:
    path = kagglehub.dataset_download(
        DATASET_HANDLE,
        output_dir=str(OUTPUT_DIR),
    )

    print("Path to dataset files:", path)


if __name__ == "__main__":
    main()
