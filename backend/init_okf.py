import sys
import os

# Add backend dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from okf.index_manager import IndexManager
from okf.git_ops import GitOps

def main():
    knowledge_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "knowledge")
    
    print("Building FTS index and updating index.md files...")
    im = IndexManager(knowledge_dir)
    im.rebuild_index()
    print("FTS index built.")
    
    print("Initializing git repository...")
    git = GitOps(knowledge_dir)
    if not git.is_initialized():
        git.init()
        git.add_and_commit("Initial seed data for knowledge base")
        print("Git repository initialized and seed data committed.")
    else:
        print("Git repository already initialized.")

if __name__ == "__main__":
    main()
