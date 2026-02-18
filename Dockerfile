# ============================================================
# Multi-stage Dockerfile for Timetable Generator
# Stage 1: Compile C++ ConstraintSolver with OR-Tools
# Stage 2: Build Next.js production bundle
# Stage 3: Slim runtime image
# ============================================================

# ── Stage 1: Build the C++ solver ──────────────────────────
FROM ubuntu:22.04 AS solver-build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Download & extract OR-Tools for Linux (C++)
WORKDIR /opt
RUN wget -q https://github.com/google/or-tools/releases/download/v9.9/or-tools_amd64_ubuntu-22.04_cpp_v9.9.3963.tar.gz \
    && tar -xzf or-tools_amd64_ubuntu-22.04_cpp_v9.9.3963.tar.gz \
    && rm or-tools_amd64_ubuntu-22.04_cpp_v9.9.3963.tar.gz

# Copy only the engine source
WORKDIR /app/engine
COPY engine/src/ ./src/

# Create a Linux-compatible CMakeLists
RUN cat > CMakeLists.txt <<'EOF'
cmake_minimum_required(VERSION 3.20)
project(TimetableScheduler CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_PREFIX_PATH "/opt/or-tools_x86_64_Ubuntu-22.04_cpp_v9.9.3963")
find_package(ortools CONFIG REQUIRED)
add_executable(scheduler src/ConstraintSolver.cpp)
target_link_libraries(scheduler PRIVATE ortools::ortools)
set_target_properties(scheduler PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")
EOF

# Build the solver
RUN mkdir build && cd build \
    && cmake .. -DCMAKE_BUILD_TYPE=Release \
    && cmake --build . --config Release -j$(nproc)


# ── Stage 2: Build the Next.js app ─────────────────────────
FROM node:20-alpine AS app-build

WORKDIR /app

# Install dependencies first (Docker cache layer)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY . .

# Build the Next.js application
# Receive build args from Railway/Docker
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Make them available as environment variables during build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build


# ── Stage 3: Production runtime ────────────────────────────
FROM node:20-slim AS runtime

WORKDIR /app

# Install glibc dependencies for OR-Tools native libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 libgcc-s1 \
    && rm -rf /var/lib/apt/lists/*

# Copy OR-Tools shared libraries
COPY --from=solver-build /opt/or-tools_x86_64_Ubuntu-22.04_cpp_v9.9.3963/lib/ /opt/ortools/lib/
ENV LD_LIBRARY_PATH="/opt/ortools/lib"

# Copy the compiled solver binary
COPY --from=solver-build /app/engine/build/bin/scheduler /app/engine/build/bin/scheduler
RUN chmod +x /app/engine/build/bin/scheduler

# Copy the built Next.js app
COPY --from=app-build /app/.next/standalone ./
COPY --from=app-build /app/.next/static ./.next/static
COPY --from=app-build /app/public ./public

# Expose port
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

CMD ["node", "server.js"]
