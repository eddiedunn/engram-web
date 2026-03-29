pipeline {
    agent { label 'linux && gpu && compute' }

    environment {
        SONAR_HOST_URL    = 'http://127.0.0.1:9200'
        SONAR_PROJECT_KEY = 'engram-web'
        DEPLOY_PLAYBOOK   = 'deploy/ansible-deploy.yml'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Trivy Security Scan') {
            agent {
                docker {
                    image 'registry.starbluesolutions.net/aquasec/trivy:0.69.3'
                    reuseNode true
                    args '--entrypoint="" -u root --network host'
                }
            }
            steps {
                sh '''trivy fs \
                    --server http://127.0.0.1:4954 \
                    --exit-code 1 \
                    --severity HIGH,CRITICAL \
                    --scanners vuln,secret \
                    --format table \
                    --skip-dirs node_modules \
                    --skip-dirs dist \
                    .'''
            }
        }

        stage('Build & Test') {
            agent {
                docker {
                    image 'registry.starbluesolutions.net/oven/bun:1'
                    reuseNode true
                    args '-u root --network host'
                }
            }
            steps {
                sh 'bun install --frozen-lockfile'
                sh 'bun run test:coverage'
                sh 'bun run build'
            }
        }

        stage('SonarQube Analysis') {
            agent {
                docker {
                    image 'registry.starbluesolutions.net/sonarsource/sonar-scanner-cli:latest'
                    reuseNode true
                    args '-u root --network host'
                }
            }
            steps {
                withCredentials([string(credentialsId: 'sonarqube-token-engram-web', variable: 'SONAR_TOKEN')]) {
                    sh '''sonar-scanner \
                        -Dsonar.projectKey="${SONAR_PROJECT_KEY}" \
                        -Dsonar.sources=src \
                        -Dsonar.tests=src/__tests__ \
                        -Dsonar.test.inclusions=src/**/*.test.ts,src/**/*.test.tsx \
                        -Dsonar.exclusions=node_modules/**,dist/** \
                        -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                        -Dsonar.host.url="${SONAR_HOST_URL}" \
                        -Dsonar.token="${SONAR_TOKEN}"'''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook \
                    -i "127.0.0.1," \
                    "${DEPLOY_PLAYBOOK}" \
                    --connection local \
                    -e "engram_web_src_dir=${WORKSPACE}" \
                    -e "build_number=${BUILD_NUMBER}"'''
            }
        }
    }

    post {
        always {
            deleteDir()
        }
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}
