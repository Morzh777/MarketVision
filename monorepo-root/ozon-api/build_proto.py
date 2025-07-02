#!/usr/bin/env python3
"""
Скрипт для генерации gRPC кода из proto файла
"""

import os
import subprocess
import sys

def build_proto():
    """Генерировать gRPC код из proto файла"""
    
    proto_file = "proto/raw-product.proto"
    output_dir = "src"
    
    if not os.path.exists(proto_file):
        print(f"❌ Proto файл не найден: {proto_file}")
        return False
    
    try:
        # Команда для генерации
        cmd = [
            sys.executable, "-m", "grpc_tools.protoc",
            f"--python_out={output_dir}",
            f"--grpc_python_out={output_dir}",
            f"--proto_path=proto",
            proto_file
        ]
        
        print(f"🔨 Генерация gRPC кода...")
        print(f"📁 Выходная директория: {output_dir}")
        
        # Выполняем команду
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ gRPC код успешно сгенерирован")
            print("📄 Созданы файлы:")
            print(f"   - {output_dir}/raw_product_pb2.py")
            print(f"   - {output_dir}/raw_product_pb2_grpc.py")
            return True
        else:
            print(f"❌ Ошибка генерации: {result.stderr}")
            return False
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    success = build_proto()
    sys.exit(0 if success else 1) 