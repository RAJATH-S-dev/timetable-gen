cmake_minimum_required(VERSION 3.20)
project(TimetableScheduler CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# OR-Tools installation directory
set(ORTOOLS_DIR "D:/or-tools_x64_VisualStudio2022_cpp_v9.9.3963")

# Use OR-Tools' own CMake package config
set(CMAKE_PREFIX_PATH "${ORTOOLS_DIR}")
find_package(ortools CONFIG REQUIRED)

# Source files
add_executable(scheduler src/ConstraintSolver.cpp)

# Windows-specific definitions
target_compile_definitions(scheduler PRIVATE
    _WIN32_WINNT=0x0601
    NOMINMAX
    WIN32_LEAN_AND_MEAN
)

# Let OR-Tools handle ALL linking automatically
target_link_libraries(scheduler PRIVATE ortools::ortools)

# Fix MSVC STL intrinsics (min_element, max_element, find_trivial etc.)
target_link_options(scheduler PRIVATE /DEFAULTLIB:msvcrt)

# Output the exe to the bin directory
set_target_properties(scheduler PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
)