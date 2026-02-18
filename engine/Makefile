# =============================================================================
# Makefile — TimetableGen Engine
# Builds ConstraintSolver.cpp -> scheduler.wasm + scheduler.js
# Requires: Emscripten SDK (emcc) + OR-Tools compiled for WASM
# =============================================================================

# --- Paths ---
# Override via: make ORTOOLS_DIR=/your/path
ORTOOLS_DIR := D:/or-tools_x64_VisualStudio2022_cpp_v9.15.6755
OUTPUT_DIR := ../public/wasm
BUILD_DIR := build
SRC := src/ConstraintSolver.cpp

# --- Emscripten Flags ---
EMCC := emcc
CXXFLAGS := -std=c++20 -O2
INCLUDES := -I$(ORTOOLS_DIR)/include
LIBS := -L$(ORTOOLS_DIR)/lib -lortools -lprotobuf -labsl_strings

# --- WASM Output Settings ---
EXPORTED_FUNCS := "['_generateTimetable', '_malloc', '_free']"
WASM_FLAGS := \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="SchedulerModule" \
    -s EXPORTED_FUNCTIONS=$(EXPORTED_FUNCS) \
    -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString","stringToUTF8"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=67108864 \
    -s MAXIMUM_MEMORY=268435456 \
    -s ENVIRONMENT='web,worker' \
    --bind

# =============================================================================
# TARGETS
# =============================================================================

.PHONY: all wasm native clean

# Default: build WASM
all: wasm

# --- WASM Build (for Next.js frontend) ---
wasm: $(BUILD_DIR)/scheduler.js
	@echo "WASM build complete -> $(OUTPUT_DIR)/scheduler.wasm"
	cp $(BUILD_DIR)/scheduler.wasm $(OUTPUT_DIR)/scheduler.wasm
	cp $(BUILD_DIR)/scheduler.js $(OUTPUT_DIR)/scheduler.js

$(BUILD_DIR)/scheduler.js: $(SRC) | $(BUILD_DIR) $(OUTPUT_DIR)
	$(EMCC) $(CXXFLAGS) $(INCLUDES) $(SRC) $(LIBS) $(WASM_FLAGS) \
		-o $(BUILD_DIR)/scheduler.js

# --- Native Build (local testing, no WASM) ---
native: $(BUILD_DIR)/scheduler_native

$(BUILD_DIR)/scheduler_native: $(SRC) | $(BUILD_DIR)
	g++ $(CXXFLAGS) $(INCLUDES) $(SRC) $(LIBS) -o $(BUILD_DIR)/scheduler_native
	@echo "Native build complete -> $(BUILD_DIR)/scheduler_native"
	@echo "Run: ./$(BUILD_DIR)/scheduler_native"

# --- Create output directories ---
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(OUTPUT_DIR):
	mkdir -p $(OUTPUT_DIR)

# --- Clean ---
clean:
	rm -rf $(BUILD_DIR)
	rm -f $(OUTPUT_DIR)/scheduler.wasm $(OUTPUT_DIR)/scheduler.js
	@echo "Clean complete"