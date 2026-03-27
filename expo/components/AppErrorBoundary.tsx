import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface AppErrorBoundaryProps {
  readonly children: React.ReactNode;
}

interface AppErrorBoundaryState {
  readonly hasError: boolean;
  readonly errorMessage?: string;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('❌ Unhandled UI error:', error, info.componentStack);
  }

  private readonly handleReset = () => {
    this.setState({
      hasError: false,
      errorMessage: undefined,
    });
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="app-error-boundary">
          <Text style={styles.title}>Bir sorun oluştu</Text>
          <Text style={styles.message}>{this.state.errorMessage ?? 'Beklenmeyen bir hata meydana geldi.'}</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset} testID="app-error-boundary-reset">
            <Text style={styles.buttonText}>Tekrar dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FDF8F2',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3B2F2F',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4A3F35',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
